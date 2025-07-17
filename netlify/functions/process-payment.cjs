const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, plan } = JSON.parse(event.body);

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

    const charge = await stripe.charges.create({
      amount: amount,
      currency: 'usd',
      description: description,
      source: token,
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
