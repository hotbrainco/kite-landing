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
    const { 
      paymentMethodId, 
      plan, 
      amount, 
      discountCode, 
      customerName, 
      churchName,
      customerEmail, 
      customerPhone 
    } = JSON.parse(event.body);
    
    // Validate required fields
    if (!paymentMethodId || !plan || !amount || !customerName || !customerEmail || !churchName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      metadata: {
        churchName: churchName,
        plan: plan,
        discountCode: discountCode || 'none'
      }
    });

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set the default payment method for the customer
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create a payment intent (for one-time payments)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      description: `Kite Church Website - ${plan} plan`,
      metadata: {
        plan: plan,
        customerName: customerName,
        churchName: churchName,
        discountCode: discountCode || 'none'
      },
      confirm: true, // Confirm the payment immediately
      return_url: 'https://kite.church/payment-success',
    });

    // Success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        customerId: customer.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      })
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: error.message || 'Payment processing failed'
      })
    };
  }
};
