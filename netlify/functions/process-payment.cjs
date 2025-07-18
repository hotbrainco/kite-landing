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
const USE_TEST_MODE = true;

// Choose the appropriate Stripe API key based on mode
const stripeSecretKey = USE_TEST_MODE 
  ? process.env.STRIPE_API_KEY_SECRET_TEST 
  : process.env.STRIPE_API_KEY_SECRET;

const stripe = require('stripe')(stripeSecretKey);

// Define our product price IDs
const PRODUCTS = {
  SETUP_FEE: {
    id: 'price_1RkulYFBc7hwldVNmNlB1zkJ',
    name: 'Kite Setup Fee'
  },
  ANNUAL_SUBSCRIPTION: {
    id: 'price_1RktLMFBc7hwldVN0TBQhz9T',
    name: 'Kite Annual Subscription'
  }
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
      const { promoId } = requestData;
      
      // Validate promo ID
      if (!promoId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing promotion ID' })
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
    
    // Otherwise, process a payment
    const { token, plan, customer } = requestData;
    
    // Validate plan
    if (plan !== 'annual') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Only annual plan is currently supported.' }),
      };
    }

    // For annual plan, we use the setup fee and annual subscription products
    const setupFeePrice = PRODUCTS.SETUP_FEE;
    
    // Get price information from Stripe
    const price = await stripe.prices.retrieve(setupFeePrice.id);
    const amount = price.unit_amount;
    const description = `${setupFeePrice.name} - Annual Plan`;

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
