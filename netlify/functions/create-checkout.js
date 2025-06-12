// This is your Netlify Function (backend in disguise)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1RYqyXFBc7hwldVNVztMCcMe', // Your Stripe price ID
          quantity: 1,
        },
      ],
      success_url: 'https://churchkite.com',
      cancel_url: 'https://churchkite.com',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
