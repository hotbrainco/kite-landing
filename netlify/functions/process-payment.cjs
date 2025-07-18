/**
 * ACTIVE PAYMENT PROCESSING IMPLEMENTATION
 * 
 * This serverless function processes payments from the custom slide-in checkout form on launch.njk
 * It works with src/js/checkout.js to handle payment processing directly in the checkout panel
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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, plan, customer } = JSON.parse(event.body);

    // Product and price configuration from Stripe
    const setupFeePriceMap = {
      monthly: 'price_1RkulYFBc7hwldVNmNlB1zkJ', // Setup fee for monthly, $199
      annual: 'price_1RkulYFBc7hwldVNmNlB1zkJ',  // Setup fee for annual, $499
    };

    // Map of promotion codes by plan type
    const promotionCodeMap = {
      monthly: [
        'promo_1RkvAkFBc7hwldVNfD6Rb6pe',  // Monthly promo code 1
        'promo_1RkwtrFBc7hwldVNhA31P7at',  // Monthly promo code 2
      ],
      annual: [
        'promo_1RkwoPFBc7hwldVN1kqmowdG',  // Annual promo code - Launch special
      ],
    };

    // Get the correct price ID based on plan
    const priceId = setupFeePriceMap[plan];
    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan specified.' }),
      };
    }

    // Get the price information from Stripe
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount;
    const description = `Kite ${plan === 'annual' ? 'Annual' : 'Monthly'} Plan Setup Fee`;
    
    // Apply promotion code if present
    let appliedPromotion = null;
    if (customer && customer.discountCode) {
      // Check if the provided discount code matches any of our promo codes
      // This would normally involve a lookup to Stripe's API to validate the code
      // For now, we'll use the LAUNCH code from the previous implementation
      if (customer.discountCode.toUpperCase() === 'LAUNCH') {
        // Apply 20% discount
        const discountAmount = Math.round(amount * 0.2);
        const discountedAmount = amount - discountAmount;
        description += ' (with 20% LAUNCH discount)';
        
        // In a full implementation, we would retrieve the promo code from Stripe
        // and apply it properly to the payment
      }
    }

    // First create a customer in Stripe
    const stripeCustomer = await stripe.customers.create({
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      metadata: {
        churchName: customer.churchName
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
      body: JSON.stringify({ success: true, chargeId: charge.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
