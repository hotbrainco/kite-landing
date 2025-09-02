/**
 * ACTIVE PAYMENT PROCESSING IMPLEMENTATION
 * 
 * This serverless function processes payments from the custom slide-in checkout form on launch.njk
 * It works with src/js/checkout.js to handle payment processing directly in the checkout panel
 * Also handles fetching promotion code information from Stripe
 * 
 * Last updated: July 2025
 */

// Load environment variables 
require('dotenv').config();

// Get configuration from the single source of truth
const envConfig = require('../../src/_data/env.cjs');

// Set this to match the same value as in src/_data/env.cjs
const USE_SANDBOX_MODE = envConfig.isSandboxMode;

// Choose the appropriate Stripe API key based on mode
const stripeSecretKey = envConfig.stripeSecretKey;

const stripe = require('stripe')(stripeSecretKey);

// Helper to get correct price IDs for the selected plan
function getPriceIds(plan) {
  return {
    SETUP_FEE: plan === 'annual' ? envConfig.stripePriceSetupFeeAnnual : envConfig.stripePriceSetupFeeMonthly,
    SUBSCRIPTION: plan === 'annual' ? envConfig.stripePriceSubscriptionAnnual : envConfig.stripePriceSubscriptionMonthly
  };
}

// Define the promo code for the annual plan
const ANNUAL_PROMO_CODE = envConfig.stripePromoAnnual || '';
const MONTHLY_PROMO_CODE = envConfig.stripePromoMonthly || '';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const requestData = JSON.parse(event.body);
    
    // Check if this is a request to get promo code details
    if (requestData.action === 'getPromoCode') {
      const { plan } = requestData;
      
      // Validate plan
      if (!plan) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing plan type' })
        };
      }
      
      // Determine promo ID based on plan
      let promoId;
      if (plan === 'annual') {
        promoId = ANNUAL_PROMO_CODE;
      } else {
        // No promo for other plans
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No promotion available for this plan' })
        };
      }
      
      try {
        // Fetch the promotion code details from Stripe
        const promotionCode = await stripe.promotionCodes.retrieve(promoId);
        
        // Return the user-friendly code and discount details
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            code: promotionCode.code,
            percentOff: promotionCode.coupon?.percent_off || 0,
            amountOff: promotionCode.coupon?.amount_off || 0,
            name: `${promotionCode.code}`
          })
        };
      } catch (error) {
        console.error('Error fetching promotion code:', error);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Promotion code not found' })
        };
      }
    }
    
    // Check if this is a request to get price information
    if (requestData.action === 'getPriceInfo') {
      const { plan } = requestData;
      if (!plan) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing plan type' })
        };
      }
      try {
        const priceIds = getPriceIds(plan);
        let lineItems = [];
        let promo = null;
        // Fetch setup fee and subscription for both plans
        const setupFee = await stripe.prices.retrieve(priceIds.SETUP_FEE, { expand: ['product'] });
        const subscription = await stripe.prices.retrieve(priceIds.SUBSCRIPTION, { expand: ['product'] });

        lineItems.push({
          id: setupFee.id,
          name: setupFee.product.name,
          description: setupFee.product.description || '',
          unitAmount: setupFee.unit_amount,
          currency: setupFee.currency,
          formattedPrice: `$${(setupFee.unit_amount / 100).toFixed(2)}`,
          interval: null,
          type: 'one_time',
          product: {
            id: setupFee.product.id,
            name: setupFee.product.name,
            description: setupFee.product.description || ''
          }
        });

        lineItems.push({
          id: subscription.id,
          name: subscription.product.name,
          description: subscription.product.description || '',
          unitAmount: subscription.unit_amount,
          currency: subscription.currency,
          formattedPrice: `$${(subscription.unit_amount / 100).toFixed(2)}/${subscription.recurring.interval}`,
          interval: subscription.recurring.interval,
          type: 'recurring',
          product: {
            id: subscription.product.id,
            name: subscription.product.name,
            description: subscription.product.description || ''
          }
        });

        // Fetch promo code for annual or monthly plan
        if (plan === 'annual') {
          try {
            const promotionCode = await stripe.promotionCodes.retrieve(ANNUAL_PROMO_CODE, {
              expand: ['coupon']
            });
            if (promotionCode.active) {
              promo = {
                id: promotionCode.id,
                code: promotionCode.code,
                coupon: promotionCode.coupon // Embed the entire coupon object
              };
            }
          } catch (promoError) {
            console.warn(`Could not retrieve promo code ${ANNUAL_PROMO_CODE}:`, promoError.message);
          }
        } else if (plan === 'monthly') {
          try {
            const promotionCode = await stripe.promotionCodes.retrieve(MONTHLY_PROMO_CODE, {
              expand: ['coupon']
            });
            if (promotionCode.active) {
              promo = {
                id: promotionCode.id,
                code: promotionCode.code,
                coupon: promotionCode.coupon // Embed the entire coupon object
              };
            }
          } catch (promoError) {
            console.warn(`Could not retrieve promo code ${MONTHLY_PROMO_CODE}:`, promoError.message);
          }
        }

        return {
          statusCode: 200,
          body: JSON.stringify({ lineItems, promo })
        };
      } catch (error) {
        console.error('Error fetching price information:', error);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Price not found' })
        };
      }
    }
    
    // Otherwise, process a payment
    const { token, plan, customer } = requestData;
    
    // Validate plan (support annual and monthly)
    if (plan !== 'annual' && plan !== 'monthly') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan. Supported: annual, monthly.' }),
      };
    }

    // Resolve price IDs for setup and subscription
    const priceIds = getPriceIds(plan);
    // First create a customer in Stripe (attach the card token as default source)
    const stripeCustomer = await stripe.customers.create({
      email: customer.email,
      name: customer.name,
      phone: customer.phone || '',
      metadata: {
        churchName: customer.churchName || ''
      },
      source: token
    });
    
    // Create subscription and put setup fee on the first invoice via add_invoice_items
    const promoId = plan === 'annual' ? ANNUAL_PROMO_CODE : MONTHLY_PROMO_CODE;
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: priceIds.SUBSCRIPTION }],
      add_invoice_items: [ { price: priceIds.SETUP_FEE } ],
      ...(promoId ? { promotion_code: promoId } : {}),
      expand: ['latest_invoice.payment_intent']
    });
    
    // Extract invoice/receipt details
    const latestInvoice = subscription.latest_invoice;
    let receiptUrl = null;
    if (latestInvoice && latestInvoice.hosted_invoice_url) {
      receiptUrl = latestInvoice.hosted_invoice_url;
    } else if (latestInvoice && latestInvoice.invoice_pdf) {
      receiptUrl = latestInvoice.invoice_pdf;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        // Use invoice id/number as confirmation reference
        chargeId: latestInvoice ? (latestInvoice.number || latestInvoice.id) : null,
        customerName: customer.name,
        customerEmail: customer.email,
        receiptUrl: receiptUrl,
        subscriptionId: subscription.id,
        invoiceId: latestInvoice ? latestInvoice.id : null
      }),
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
