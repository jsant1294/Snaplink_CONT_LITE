# Signed State

Return and refresh URLs contain a ten-minute HMAC-signed state instead of a PIN. It contains contractor ID, an allowlisted contractor-Invoices destination, issued/expiry times, and a random nonce. Invalid, expired, tampered, or unsafe-destination tokens fail closed.

The nonce makes tokens unique and the short lifetime limits replay exposure. One-time persistence is not implemented; replacing PIN authentication with full sessions remains the longer-term solution.
