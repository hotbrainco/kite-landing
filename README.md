## Environment Modes (Stripe)

KITE_MODE controls which Stripe ID bank is used by the site and Netlify functions.

Modes:
- sandbox: uses SANDBOX_* IDs and test keys
- live: uses LIVE_* IDs and live keys
- live_test: uses LIVE_TEST_* IDs (your $1 live Prices) and live keys

How to set:
- Netlify: Site settings > Build & deploy > Environment > add/update KITE_MODE
- Local: create .env and add `KITE_MODE=sandbox|live|live_test`

Where to paste Stripe IDs:
- File: `src/_data/env.cjs`
- Each mode has 3 blocks: Setup Fees, Plans, Promotions.
- Paste the relevant Price IDs (`price_...`) and Promotion Code IDs (`promo_...`).

Required env vars (Netlify):
- STRIPE_API_KEY_PUBLIC (live) / STRIPE_API_KEY_PUBLIC_TEST (sandbox)
- STRIPE_API_KEY_SECRET (live) / STRIPE_API_KEY_SECRET_TEST (sandbox)

Notes:
- Current backend charges the Setup Fee only; subscription creation isn’t triggered.
- LIVE_TEST mode is for safe real-card checks with $1 Prices; flip back to `live` when done.
