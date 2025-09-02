// =====================================================
// src/_data/env.cjs
// Expose environment variables and Stripe config to Eleventy build
// =====================================================

require('dotenv').config();

// =====================================================
// MODE CONFIGURATION
// =====================================================
// KITE_MODE controls which Stripe ID bank is used throughout the site.
// Values:
//   - 'sandbox'   => uses SANDBOX_* IDs and Stripe test keys
//   - 'live'      => uses LIVE_* IDs and Stripe live keys
//   - 'live_test' => uses LIVE_TEST_* IDs (your $1 Prices) with Stripe live keys
// Set in Netlify: Site settings > Build & deploy > Environment > KITE_MODE
// Set locally: add KITE_MODE to your .env file
const MODE = process.env.KITE_MODE || 'live';
const USE_SANDBOX_MODE = MODE === 'sandbox';
const USE_LIVE_TEST_MODE = MODE === 'live_test';

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
// Setup Fees
const LIVE_SETUP_FEE_ANNUAL         = 'price_1RkulYFBc7hwldVNmNlB1zkJ';         // <-- Live Setup Fee (Annual) ID
const LIVE_SETUP_FEE_MONTHLY        = 'price_1RkuvfFBc7hwldVNO6eoFrCN';        // <-- Live Setup Fee (Monthly) ID
// Plans
const LIVE_SUBSCRIPTION_ANNUAL      = 'price_1RktLMFBc7hwldVN0TBQhz9T';      // <-- Live Subscription (Annual) ID
const LIVE_SUBSCRIPTION_MONTHLY     = 'price_1RktKRFBc7hwldVNQVDEPELh';     // <-- Live Subscription (Monthly) ID
// Promotions
const LIVE_PROMO_ANNUAL             = 'promo_1RkwoPFBc7hwldVN1kqmowdG';                   // <-- Live Promo Code (Annual) ID
const LIVE_PROMO_MONTHLY            = 'promo_1RkwtrFBc7hwldVNhA31P7at';                  // <-- Live Promo Code (Monthly) ID

// ----------- LIVE TEST (third bank) -----------
// Paste your $1 live IDs here; select with MODE=live_test (KITE_MODE env)
// Setup Fees
const LIVE_TEST_SETUP_FEE_ANNUAL         = 'price_1S2xYAFBc7hwldVNG1aEUnvE';
const LIVE_TEST_SETUP_FEE_MONTHLY        = 'price_1S2xYAFBc7hwldVNG1aEUnvE';
// Plans
const LIVE_TEST_SUBSCRIPTION_ANNUAL      = 'price_1S2xZkFBc7hwldVNa1ilWqEM';
const LIVE_TEST_SUBSCRIPTION_MONTHLY     = 'price_1S2xZxFBc7hwldVN3lSGusE7';
// Promotions
const LIVE_TEST_PROMO_ANNUAL             = 'promo_live_test_annual';
const LIVE_TEST_PROMO_MONTHLY            = 'promo_live_test_monthly';

// =====================================================
// RUNTIME SAFETY (non-fatal warnings)
// =====================================================
// When switching to LIVE, surface helpful warnings if config looks incomplete.
if (!USE_SANDBOX_MODE) {
  const warn = (msg) => console.warn(`[env.cjs] ${msg}`);
  if (!process.env.STRIPE_API_KEY_PUBLIC) warn('LIVE mode: STRIPE_API_KEY_PUBLIC is not set');
  if (!process.env.STRIPE_API_KEY_SECRET) warn('LIVE mode: STRIPE_API_KEY_SECRET is not set');

  const looksPlaceholder = (v) => typeof v === 'string' && /^(price|promo)_live/i.test(v);
  if (looksPlaceholder(LIVE_SETUP_FEE_ANNUAL)) warn('LIVE_SETUP_FEE_ANNUAL appears to be a placeholder');
  if (looksPlaceholder(LIVE_SUBSCRIPTION_ANNUAL)) warn('LIVE_SUBSCRIPTION_ANNUAL appears to be a placeholder');
  if (looksPlaceholder(LIVE_PROMO_ANNUAL)) warn('LIVE_PROMO_ANNUAL appears to be a placeholder');
  if (looksPlaceholder(LIVE_SETUP_FEE_MONTHLY)) warn('LIVE_SETUP_FEE_MONTHLY appears to be a placeholder');
  if (looksPlaceholder(LIVE_SUBSCRIPTION_MONTHLY)) warn('LIVE_SUBSCRIPTION_MONTHLY appears to be a placeholder');
  if (looksPlaceholder(LIVE_PROMO_MONTHLY)) warn('LIVE_PROMO_MONTHLY appears to be a placeholder');

  if (USE_LIVE_TEST_MODE) {
    warn('MODE=live_test: Using LIVE_TEST_* IDs for prices/promos.');
    const looksTestPlaceholder = (v) => typeof v === 'string' && /^(price|promo)_live_test/i.test(v);
    if (looksTestPlaceholder(LIVE_TEST_SETUP_FEE_ANNUAL)) warn('LIVE_TEST_SETUP_FEE_ANNUAL appears to be a placeholder');
    if (looksTestPlaceholder(LIVE_TEST_SUBSCRIPTION_ANNUAL)) warn('LIVE_TEST_SUBSCRIPTION_ANNUAL appears to be a placeholder');
    if (looksTestPlaceholder(LIVE_TEST_SETUP_FEE_MONTHLY)) warn('LIVE_TEST_SETUP_FEE_MONTHLY appears to be a placeholder');
    if (looksTestPlaceholder(LIVE_TEST_SUBSCRIPTION_MONTHLY)) warn('LIVE_TEST_SUBSCRIPTION_MONTHLY appears to be a placeholder');
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // MODE & STRIPE KEYS
  isSandboxMode: USE_SANDBOX_MODE,
  mode: MODE,

  stripePublishableKey: USE_SANDBOX_MODE 
    ? process.env.STRIPE_API_KEY_PUBLIC_TEST 
    : process.env.STRIPE_API_KEY_PUBLIC,

  stripeSecretKey: USE_SANDBOX_MODE
    ? process.env.STRIPE_API_KEY_SECRET_TEST
    : process.env.STRIPE_API_KEY_SECRET,

  // STRIPE PRICE & PROMO IDS (refer to constants above)
  stripePriceSetupFeeAnnual: USE_SANDBOX_MODE
    ? SANDBOX_SETUP_FEE_ANNUAL
    : (USE_LIVE_TEST_MODE ? LIVE_TEST_SETUP_FEE_ANNUAL : LIVE_SETUP_FEE_ANNUAL),
  stripePriceSetupFeeMonthly: USE_SANDBOX_MODE
    ? SANDBOX_SETUP_FEE_MONTHLY
    : (USE_LIVE_TEST_MODE ? LIVE_TEST_SETUP_FEE_MONTHLY : LIVE_SETUP_FEE_MONTHLY),

  stripePriceSubscriptionAnnual: USE_SANDBOX_MODE
    ? SANDBOX_SUBSCRIPTION_ANNUAL
    : (USE_LIVE_TEST_MODE ? LIVE_TEST_SUBSCRIPTION_ANNUAL : LIVE_SUBSCRIPTION_ANNUAL),
  stripePriceSubscriptionMonthly: USE_SANDBOX_MODE
    ? SANDBOX_SUBSCRIPTION_MONTHLY
    : (USE_LIVE_TEST_MODE ? LIVE_TEST_SUBSCRIPTION_MONTHLY : LIVE_SUBSCRIPTION_MONTHLY),

  stripePromoAnnual: USE_SANDBOX_MODE
  ? SANDBOX_PROMO_ANNUAL
  : (USE_LIVE_TEST_MODE ? LIVE_TEST_PROMO_ANNUAL : LIVE_PROMO_ANNUAL),
  stripePromoMonthly: USE_SANDBOX_MODE
  ? SANDBOX_PROMO_MONTHLY
  : (USE_LIVE_TEST_MODE ? LIVE_TEST_PROMO_MONTHLY : LIVE_PROMO_MONTHLY)
};