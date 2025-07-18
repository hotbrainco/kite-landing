// src/_data/env.cjs
// Expose environment variables to the Eleventy build
require('dotenv').config();

// Set this to true for test mode, false for live mode
const USE_TEST_MODE = false;

module.exports = {
  // Mode indicator for templates to use if needed
  isTestMode: USE_TEST_MODE,
  
  // Stripe keys - automatically selects between test and live based on USE_TEST_MODE
  stripePublishableKey: USE_TEST_MODE 
    ? process.env.STRIPE_API_KEY_PUBLIC_TEST 
    : process.env.STRIPE_API_KEY_PUBLIC,
  
  stripeSecretKey: USE_TEST_MODE
    ? process.env.STRIPE_API_KEY_SECRET_TEST
    : process.env.STRIPE_API_KEY
};
