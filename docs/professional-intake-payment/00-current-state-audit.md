# Current Payment State Audit

## Sources found

| Source | File | Purpose | Usable for publication gate | Notes |
|---|---|---|---:|---|
| `AgentProfile.tier` | `lib/agent-profiles/types.ts` | Canonical SnapLink tier (solo/professional/business/growth/enterprise) | Yes | The "selected plan," agent-only |
| `AgentProfile.billingSubscriptionId/-TenantId/-OrganizationId` | `lib/agent-profiles/types.ts` | Opaque references into the real-estate billing engine's subscription record | Yes | Set by `subscribeAgentToTier()` |
| `subscribeAgentToTier()` / `applyAgentTier()` | `lib/agent-profiles/billing.ts` | Assigns a tier, mechanically applies its module bundle, optionally creates a real subscription | Yes | Tier-authoritative (a tier change resets modules to the tier bundle) |
| `realEstateBillingSubscriptions` (`status: "active"\|"canceled"`) | `lib/real-estate/marketplace/billing.ts` via `lib/db/schema.ts` | Real subscription record, reused unmodified (agent profiles are treated as "tenants of one") | Yes | **Must stay untouched** — `tests/real-estate-phase11.test.mjs` enforces this |
| `realEstateBillingInvoices` (`status: "open"\|"paid"`, `paidAt`, `dueAt`) | same | Real invoice record for a subscription | Yes | No `past_due`/`failed`/`refunded` raw status exists in this engine — those are only reachable via manual override (below) |
| `agentSubscriptions()` / `agentInvoices()` | `lib/agent-profiles/billing.ts` | Read-only wrappers over the above, scoped to one agent profile | Yes | Already exported, ready to reuse as-is |
| `professional_module_entitlements` (`lib/entitlements.ts`) | operator on/off per contractor module (Flipbook/Campaigns/Invoices) | No | This is feature-flag access, not a payment/plan status — unrelated to "has this profile's plan been paid" |
| Contractor plan/tier | *(none found)* | — | — | **Contractors have no tier/subscription concept at all.** Only Stripe Connect fields exist (`stripeAccountId`, `stripeConnectStatus`, etc.), which is the contractor *collecting* money from their own customers — the opposite direction from this task |
| Manual payment/comp flag | *(none found before this task)* | — | — | Confirmed via repo-wide grep for `paymentStatus`/`subscriptionStatus`/`comped`/`manualPayment` — zero hits anywhere |
| Intake apply route | `app/api/professional-intake/sessions/[id]/apply/route.ts` | Writes intake answers onto the live profile | N/A | Never touches `snaplinkStatus`/`southlineStatus` — publication was never wired into the intake flow at all until this task |
| Publish route | *(none found)* | — | — | No dedicated "publish" endpoint existed. `snaplinkStatus`/`southlineStatus` are only ever set via the general agent PATCH route (`app/api/agent-profiles/[id]/route.ts`, operator-editable, unguarded by payment) or at creation |

## Answers

1. **Where is the selected plan stored?** `AgentProfile.tier` (agents only — contractors have no plan/tier field).
2. **Where is payment status stored?** Nowhere, directly — it's derived from `realEstateBillingSubscriptions`/`realEstateBillingInvoices` (agents with a tier) or, for everyone, from the new manual override columns added by this task.
3. **Is subscription status already persisted?** Yes, for agents, via the reused real-estate billing engine (`status: "active"|"canceled"` on the subscription row).
4. **Is there a one-time setup-payment concept?** No — the reused billing engine only models recurring subscription invoices, no separate one-time setup fee.
5. **Are manual or complimentary profiles supported?** Not before this task. New `manualPaymentStatus`/`manualPaymentNote`/`manualPaymentSetAt`/`manualPaymentSetBy` columns added to both `contractors` and `agent_profiles` (Phase 6).
6. **Is publication currently independent of payment?** Yes, completely — `snaplinkStatus`/`southlineStatus` can be set to `"published"` via the existing operator PATCH route with no payment check anywhere.
7. **Which route applies intake changes?** `POST /api/professional-intake/sessions/[id]/apply` (built in the prior professional-intake task) — unchanged by this task.
8. **Which route publishes the profile?** None existed. This task adds `POST /api/professional-intake/sessions/[id]/publish`.
9. **Do contractor and agent/professional payments differ?** Substantially — agents have a real tier + subscription + invoice chain; contractors have none, so a contractor's payment status is *only* ever a manual operator override (defaults to `not_required` since there is no contractor plan product yet).
10. **Can this be completed without a migration?** No — confirmed by the repo-wide grep above; there was no existing field anywhere to represent a manual payment/comp status. A migration was genuinely required (Phase 6/12) — generated (`drizzle/0024_manual_payment_status.sql`) but not applied, per instruction.

## Migration coordination note

The earlier duplicate `0024` collision is resolved: Stripe Connect readiness is `drizzle/0026_stripe_connect_readiness.sql`, after `0024_manual_payment_status` and `0025_intake_content_approval`. None of these pending additive migrations has been applied.
