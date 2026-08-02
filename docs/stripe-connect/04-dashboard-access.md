# Dashboard Access

`POST /api/contractor/invoices/connect/dashboard` creates an Express login link. It requires contractor authorization, the Invoices entitlement, configured Stripe, and an existing connected account. Stripe failures return a generic message and never expose provider details.
