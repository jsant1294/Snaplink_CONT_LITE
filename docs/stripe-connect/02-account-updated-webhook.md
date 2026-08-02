# Account Updated Webhook

The existing signature verification and `processed_webhook_events` deduplication run before handling `account.updated`. The contractor is resolved by connected-account ID and updated from the server-supplied Stripe Account object. Unknown accounts do not throw; their processed event is recorded as `account.updated.unknown_account`. Existing invoice event handling is unchanged.
