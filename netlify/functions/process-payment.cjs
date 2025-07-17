// Load environment variables
require('dotenv').config();

// Set this to match the same value as in src/_data/env.cjs
const USE_TEST_MODE = true;

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

    // This is a simplified example. In a real application, you would
    // create a customer, a subscription, and handle payment intents.
    // For this example, we'll just create a charge.

    let amount;
    let description;

    if (plan === 'annual') {
      amount = 49900; // $499.00 in cents
      description = 'Kite Annual Plan Setup Fee';
    } else if (plan === 'monthly') {
      amount = 19900; // $199.00 in cents
      description = 'Kite Monthly Plan Setup Fee';
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan specified.' }),
      };
    }
    
    // Apply discount if code is present
    if (customer && customer.discountCode) {
      if (customer.discountCode.toUpperCase() === 'LAUNCH') {
        // Apply 20% discount
        const discountAmount = Math.round(amount * 0.2);
        amount -= discountAmount;
        description += ' (with 20% LAUNCH discount)';
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
