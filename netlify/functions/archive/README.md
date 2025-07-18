# Archived Functions

This directory contains archived Netlify functions that are no longer in active use but are preserved for reference.

## Contents

- **create-checkout.cjs** - Legacy implementation of the Stripe checkout process that redirected users to the Stripe Checkout page. This has been replaced by the custom slide-in checkout form in `launch.njk` that uses `process-payment.cjs`.

## When to Use

These functions should only be restored if there's a need to revert to previous functionality. Before restoring any archived function, ensure you understand its purpose and dependencies.

## Last Updated

July 2025
