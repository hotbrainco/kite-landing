// src/_data/env.js
// Expose environment variables to the Eleventy build
require('dotenv').config();

module.exports = {
  stripePublishableKey: process.env.STRIPE_API_KEY_PUBLIC
};
