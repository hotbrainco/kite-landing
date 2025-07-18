/**
 * ACTIVE PROMOTION CODE RETRIEVAL
 * 
 * This serverless function fetches promotion code details from Stripe
 * It's used to display friendly promo code names to users in the checkout form
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const { promoId, plan } = event.queryStringParameters || {};

  if (!promoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing promotion ID' })
    };
  }

  try {
    // Retrieve the promotion code from Stripe
    const promotionCode = await stripe.promotionCodes.retrieve(promoId);
    
    // Return the promotion code details
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: promotionCode.id,
        code: promotionCode.code,  // This is the user-friendly code like "LAUNCH2025"
        active: promotionCode.active,
        percentOff: promotionCode.coupon.percent_off,
        amountOff: promotionCode.coupon.amount_off,
        duration: promotionCode.coupon.duration
      })
    };
  } catch (error) {
    console.error('Error retrieving promotion code:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
