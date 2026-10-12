# ADR-0008: Billing and entitlements

- Status: Proposed — decide in P7 after R1/R2 validation ([monetization](../../product/MONETIZATION.md))
- Date: 2026-10-12

## Context
Subscriptions sold to consumers across the EU/CH (VAT/OSS obligations), later in app stores. Solo founder: tax/compliance work must be minimal.

## Options
- **Paddle (merchant of record)** — handles VAT, invoices, chargebacks; higher fee. *Proposed for web.*
- **Stripe Billing** — lower fee, more control; VAT/OSS handling falls on the founder (Stripe Tax helps but does not make it the seller of record).
- **Lemon Squeezy** — merchant of record, smaller ecosystem.
- **RevenueCat + App Store/Play billing** — required once native apps sell subscriptions.

## Proposed decision
Paddle for web subscriptions; RevenueCat when native apps ship; a single `entitlements` table written only by server webhooks (see [data & privacy](../DATA_AND_PRIVACY.md)).

## Verification (when accepted)
Webhook signature tests, idempotent entitlement updates, sandbox purchase/cancel/refund E2E.
