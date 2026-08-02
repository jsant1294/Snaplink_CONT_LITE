# Test Mode Procedure

1. Apply migration `0024` to an isolated test database after review.
2. Configure `DATABASE_URL`, `APP_URL`, an `sk_test_` secret, test webhook secret, and a random `STRIPE_CONNECT_STATE_SECRET` of at least 32 bytes.
3. Forward Stripe test webhooks to `/api/webhooks/stripe` and subscribe to `account.updated` plus the existing invoice events.
4. Enable the contractor Invoices entitlement and open its PIN-gated Invoices page.
5. Complete Express onboarding with Stripe test data, verify all four UI states, resume behavior, and dashboard access.

Automated tests explicitly disable Stripe if a live key is present while `NODE_ENV=test`.
