// Load Stripe with secret key from environment variable
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

exports.handler = async (event) => {
  // 🚫 Reject any non-POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  let interval;

  // ✅ Safely parse the JSON body
  try {
    ({ interval } = JSON.parse(event.body));
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid or missing JSON body' }),
    };
  }

  try {
    // Define your Stripe price IDs
    const recurringPriceMap = {
      monthly: 'price_1RktKRFBc7hwldVNQVDEPELh', // Monthly subscription
      annual: 'price_1RktLMFBc7hwldVN0TBQhz9T',  // Annual subscription
    };
    const setupFeePrice = 'price_1RkulYFBc7hwldVNmNlB1zkJ'; // One-time setup fee

    // Get the correct recurring price ID based on input
    const recurringPrice = recurringPriceMap[interval];

    // Validate interval choice
    if (!recurringPrice) {
      throw new Error('Invalid subscription interval provided.');
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: setupFeePrice, // Setup fee
          quantity: 1,
        },
        {
          price: recurringPrice, // Monthly or Annual
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: interval === 'annual' ? 365 : 30,
      },
      success_url: 'https://churchkite.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://churchkite.com/cancel',
    });

    // ✅ Return the Stripe checkout session URL to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    // ❌ Handle and return any errors that occur
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
};