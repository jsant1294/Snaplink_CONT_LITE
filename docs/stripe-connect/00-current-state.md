# Current State

Contractor Invoices reuses the existing Stripe Connect Express onboarding flow. Agent profiles, SnapLink Local, subscriptions, rentals, and merchant-of-record behavior remain out of scope. Connect is disabled unless PostgreSQL and a Stripe secret are configured; signed redirects additionally require `STRIPE_CONNECT_STATE_SECRET`.

The readiness migration is created at `drizzle/0026_stripe_connect_readiness.sql` but was not applied.
