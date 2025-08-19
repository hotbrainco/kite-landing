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
        if (plan === 'annual') {
          // Log the price IDs being used
          console.log('Stripe Price IDs (Annual):', priceIds);
          // Fetch both setup fee (one-time) and annual subscription (recurring)
          const setupFee = await stripe.prices.retrieve(priceIds.SETUP_FEE, { expand: ['product'] });
          const annualSub = await stripe.prices.retrieve(priceIds.SUBSCRIPTION, { expand: ['product'] });

          const lineItems = [
            {
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
            },
            {
              id: annualSub.id,
              name: annualSub.product.name,
              description: annualSub.product.description || '',
              unitAmount: annualSub.unit_amount,
              currency: annualSub.currency,
              formattedPrice: `$${(annualSub.unit_amount / 100).toFixed(2)}/${annualSub.recurring.interval}`,
              interval: annualSub.recurring.interval,
              type: 'recurring',
              product: {
                id: annualSub.product.id,
                name: annualSub.product.name,
                description: annualSub.product.description || ''
              }
            }
          ];

          // Also fetch the promotion code for the annual plan
          let promo = null;
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

          return {
            statusCode: 200,
            body: JSON.stringify({ lineItems, promo })
          };
        } else if (plan === 'monthly') {
          // Log the price ID being used for monthly
          console.log('Stripe Price IDs (Monthly):', priceIds);
          // Only return the recurring line item for monthly
          const monthly = await stripe.prices.retrieve(priceIds.SUBSCRIPTION, { expand: ['product'] });
          const lineItems = [
            {
              id: monthly.id,
              name: monthly.product.name,
              description: monthly.product.description || '',
              unitAmount: monthly.unit_amount,
              currency: monthly.currency,
              formattedPrice: `$${(monthly.unit_amount / 100).toFixed(2)}/${monthly.recurring.interval}`,
              interval: monthly.recurring.interval,
              type: 'recurring',
              product: {
                id: monthly.product.id,
                name: monthly.product.name,
                description: monthly.product.description || ''
              }
            }
          ];
          return {
            statusCode: 200,
            body: JSON.stringify({ lineItems })
          };
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid plan type' })
          };
        }
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
    
    // Validate plan
    if (plan !== 'annual') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Only annual plan is currently supported.' }),
      };
    }

    // Get the price ID for the setup fee based on plan
    const priceIds = getPriceIds(plan);
    const priceId = priceIds.SETUP_FEE;
    // Fetch price information from Stripe
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'] // Expand the product information
    });
    
    const amount = price.unit_amount;
    const description = `${price.product.name} - Annual Plan`;

    // First create a customer in Stripe
    const stripeCustomer = await stripe.customers.create({
      email: customer.email,
      name: customer.name,
      phone: customer.phone || '',
      metadata: {
        churchName: customer.churchName || ''
      },
      source: token
    });

    // Then create the charge using the customer ID
    const charge = await stripe.charges.create({
      amount: amount,
      currency: 'usd',
      description: description,
      customer: stripeCustomer.id,
      receipt_email: customer.email // Stripe will send receipt email
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        chargeId: charge.id,
        customerName: customer.name,
        customerEmail: customer.email
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
