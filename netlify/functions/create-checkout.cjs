const stripe = require('stripe')(process.env.STRIPE_API_KEY);

console.log("✅ STRIPE_API_KEY:", process.env.STRIPE_API_KEY ? "Loaded" : "NOT FOUND");

exports.handler = async (event) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1RYqyXFBc7hwldVNVztMCcMe', // Your actual working price ID
          quantity: 1,
        },
      ],
      success_url: 'https://churchkite.com/success',
      cancel_url: 'https://churchkite.com/canceled',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('❌ Stripe Checkout Session Error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      raw: error.raw,
    });

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Unknown error during checkout',
        type: error.type || 'UnknownType',
        code: error.code || 'UnknownCode',
        param: error.param || null,
      }),
    };
  }
};