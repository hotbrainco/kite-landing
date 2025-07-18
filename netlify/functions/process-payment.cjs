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

// Set this to match the same value as in src/_data/env.cjs
const USE_TEST_MODE = false;

// Choose the appropriate Stripe API key based on mode
const stripeSecretKey = USE_TEST_MODE 
  ? process.env.STRIPE_API_KEY_SECRET_TEST 
  : process.env.STRIPE_API_KEY_SECRET;

const stripe = require('stripe')(stripeSecretKey);

// Define price IDs - we'll fetch the actual details from Stripe
const PRICE_IDS = {
  SETUP_FEE: 'price_1RkulYFBc7hwldVNmNlB1zkJ',
  ANNUAL_SUBSCRIPTION: 'price_1RktLMFBc7hwldVN0TBQhz9T'
};

// Define the promo code for the annual plan
const ANNUAL_PROMO_CODE = 'promo_1RkwoPFBc7hwldVN1kqmowdG';

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
      
      // Determine the price ID based on the plan
      let priceId;
      if (plan === 'annual') {
        priceId = PRICE_IDS.SETUP_FEE;
      } else if (plan === 'monthly') {
        priceId = PRICE_IDS.ANNUAL_SUBSCRIPTION; // Using this ID for monthly for now
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid plan type' })
        };
      }
      
      try {
        // Fetch price information from Stripe
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product'] // Expand the product information
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            id: price.id,
            name: price.product.name,
            description: price.product.description || '',
            unitAmount: price.unit_amount,
            currency: price.currency,
            formattedPrice: `$${(price.unit_amount / 100).toFixed(2)}${price.recurring ? '/' + price.recurring.interval : ''}`,
            interval: price.recurring ? price.recurring.interval : null,
            product: {
              id: price.product.id,
              name: price.product.name,
              description: price.product.description || ''
            }
          })
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
    
    // Validate plan
    if (plan !== 'annual') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Only annual plan is currently supported.' }),
      };
    }

    // Get the price ID for the setup fee based on plan
    const priceId = PRICE_IDS.SETUP_FEE;
    
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
      customer: stripeCustomer.id
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
