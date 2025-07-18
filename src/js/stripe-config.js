/**
 * Stripe Configuration
 * 
 * This file sets the global Stripe publishable key.
 * It is intentionally NOT wrapped in a DOMContentLoaded listener so that
 * the window.stripePublishableKey is available immediately for other scripts.
 * 
 * Last updated: July 2025
 */

// Get the key and mode from the global scope (set in base.njk from Eleventy data)
const key = window.stripePublishableKey;
const mode = window.isTestMode ? 'TEST MODE' : 'LIVE MODE';

console.log('Stripe key:', key);
console.log('Stripe mode:', mode);
