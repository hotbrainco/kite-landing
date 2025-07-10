const stripe = require('stripe')(process.env.STRIPE_API_KEY);

console.log("✅ STRIPE_API_KEY:", process.env.STRIPE_API_KEY ? "Loaded" : "NOT FOUND");

const priceMap = {
  default: 'price_1RYqyXFBc7hwldVNVztMCcMe', // original/standard offer
  promoA: 'price_xxx_promoA', // replace with real Stripe Price ID
  promoB: 'price_yyy_promoB', // replace with real Stripe Price ID
};

exports.handler = async (event) => {
  try {
    const { plan = 'default' } = JSON.parse(event.body || '{}');
    const priceId = priceMap[plan];

    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan specified' }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
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