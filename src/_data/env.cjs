// =====================================================
// src/_data/env.cjs
// Expose environment variables and Stripe config to Eleventy build
// =====================================================

require('dotenv').config();

// =====================================================
// MODE CONFIGURATION
// =====================================================

// Set this to true for sandbox mode, false for live mode
const USE_SANDBOX_MODE = true;

// =====================================================
// STRIPE PRICE & PROMO ID CONSTANTS
// =====================================================

// ----------- SANDBOX -----------
// Setup Fees
const SANDBOX_SETUP_FEE_ANNUAL      = 'price_1RxrrIFQIhMSueoR197i5laR'; 
const SANDBOX_SETUP_FEE_MONTHLY     = 'price_1RxrrjFQIhMSueoR74Et8jo3';  
// Plans
const SANDBOX_SUBSCRIPTION_ANNUAL   = 'price_1RxrtvFQIhMSueoR6kHFVotQ';   // <-- Sandbox Subscription (Annual) ID
const SANDBOX_SUBSCRIPTION_MONTHLY  = 'price_1RxruWFQIhMSueoR57ixEjwr';  // <-- Sandbox Subscription (Monthly) ID
// Promotions
const SANDBOX_PROMO_ANNUAL          = 'promo_1RxsOEFQIhMSueoR0h7ciKw5';                // <-- Sandbox Promo Code (Annual) ID
const SANDBOX_PROMO_MONTHLY         = 'promo_1RxsO4FQIhMSueoRlSKS92eY'; 

// ----------- LIVE -----------
// -- Annual Plan (Live) --
const LIVE_SETUP_FEE_ANNUAL         = 'price_live_setup_fee_annual';         // <-- Live Setup Fee (Annual) ID
const LIVE_SUBSCRIPTION_ANNUAL      = 'price_live_subscription_annual';      // <-- Live Subscription (Annual) ID
const LIVE_PROMO_ANNUAL             = 'promo_live_annual';                   // <-- Live Promo Code (Annual) ID
// -- Monthly Plan (Live) --
const LIVE_SETUP_FEE_MONTHLY        = 'price_live_setup_fee_monthly';        // <-- Live Setup Fee (Monthly) ID
const LIVE_SUBSCRIPTION_MONTHLY     = 'price_live_subscription_monthly';     // <-- Live Subscription (Monthly) ID
const LIVE_PROMO_MONTHLY            = 'promo_live_monthly';                  // <-- Live Promo Code (Monthly) ID

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // MODE & STRIPE KEYS
  isSandboxMode: USE_SANDBOX_MODE,

  stripePublishableKey: USE_SANDBOX_MODE 
    ? process.env.STRIPE_API_KEY_PUBLIC_TEST 
    : process.env.STRIPE_API_KEY_PUBLIC,

  stripeSecretKey: USE_SANDBOX_MODE
    ? process.env.STRIPE_API_KEY_SECRET_TEST
    : process.env.STRIPE_API_KEY_SECRET,

  // STRIPE PRICE & PROMO IDS (refer to constants above)
  stripePriceSetupFeeAnnual: USE_SANDBOX_MODE
    ? SANDBOX_SETUP_FEE_ANNUAL
    : LIVE_SETUP_FEE_ANNUAL,
  stripePriceSetupFeeMonthly: USE_SANDBOX_MODE
    ? SANDBOX_SETUP_FEE_MONTHLY
    : LIVE_SETUP_FEE_MONTHLY,

  stripePriceSubscriptionAnnual: USE_SANDBOX_MODE
    ? SANDBOX_SUBSCRIPTION_ANNUAL
    : LIVE_SUBSCRIPTION_ANNUAL,
  stripePriceSubscriptionMonthly: USE_SANDBOX_MODE
    ? SANDBOX_SUBSCRIPTION_MONTHLY
    : LIVE_SUBSCRIPTION_MONTHLY,

  stripePromoAnnual: USE_SANDBOX_MODE
    ? SANDBOX_PROMO_ANNUAL
    : LIVE_PROMO_ANNUAL,
  stripePromoMonthly: USE_SANDBOX_MODE
    ? SANDBOX_PROMO_MONTHLY
    : LIVE_PROMO_MONTHLY
};