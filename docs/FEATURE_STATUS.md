# Feature status: implemented vs planned

Reviewed against the code in this branch. "Implemented" means the code path exists, is covered by automated tests where noted, and was exercised with `next build`. Nothing here has been run against a real production database, a live Stripe account, or a real SMTP provider.

| Feature | Status | Notes |
|---|---|---|
| Printed AI Policy & Evidence Binder ($249.99 one-time) | IMPLEMENTED (checkout) / MANUAL (fulfillment) | Stripe Checkout collects a U.S. shipping address. Printing and mailing are manual; the owner gets an email alert when SMTP and `PALADIN_ORDER_NOTIFY_EMAIL` are set. The print master PDF is not regenerated yet (see PRINT_PDF_REGEN.md). |
| Starter annual membership ($499/yr) with guest checkout | IMPLEMENTED | Account is created after payment by the webhook. Needs the live webhook and live prices. |
| Public registry record page and QR code | IMPLEMENTED | Shows that a binder was issued to the organization. Self-published; not an audit, certification, or verification. |
| Registry record PDF | IMPLEMENTED | Generated on demand. |
| Quick-reference record (13-page PDF) | IMPLEMENTED | Generated on demand, no storage. |
| AI spend record (browser-local) | IMPLEMENTED | Stored in the browser only; clearing browser data deletes it. |
| AI spend record saved to account, annual summary (CSV, printable) | IMPLEMENTED | Organization-scoped; owners and admins write. |
| Annual binder revision log with email notice | IMPLEMENTED | Admin-published, append-only, notices deduplicated, opt-out honored. |
| Renewal reminder email (30 days) | IMPLEMENTED | Transactional; needs cron and SMTP. |
| Compliance calendar (dashboard + .ics) | IMPLEMENTED | Dates derive from the membership period. |
| Calendar reminder emails | IMPLEMENTED | 7 days before, deduplicated, per-run cap, one-click unsubscribe. Needs cron and SMTP. |
| Training modules (3) with acknowledgment records | IMPLEMENTED | Owner records named acknowledgments; CSV export. No quizzes, individual logins, or certificates. |
| Review checklists (AI tool inventory, vendor review) with dated records | IMPLEMENTED | CSV export. |
| Email support, business days, best effort | IMPLEMENTED (as policy) | No SLA. The contact mailbox must be verified by the owner. |
| Additional printed binders ($124.99) | IMPLEMENTED (checkout), MANUAL (fulfillment) | Available to active members. |
| Operational plans ($1,499 to $4,999/yr) | NOT SELF-SERVE | Contact-only. Checkout is disabled unless `PALADIN_OPERATIONAL_CHECKOUT_ENABLED=true`. Nothing beyond Starter is implemented for them. |
| Enterprise plan | CONTACT-ONLY | Scope confirmed in writing before purchase. |
| HIPAA add-on | REMOVED from every customer-facing surface | Enum values, database fields, and legacy price keys remain for compatibility. No purchase path exists. No HIPAA-specific materials are offered. |
| Multi-user invitations, per-person training logins | PLANNED (not built) | Training acknowledgments are recorded by the owner. |
| Training certificates | NOT OFFERED | By design: acknowledgments only. |
| Durable file storage for generated assets | NOT NEEDED / NOT BUILT | Assets are generated on demand. Legacy stored assets still download if present. |
| Verification or certification of any kind | NOT OFFERED | |
| Order database / order status page | PLANNED (not built) | Stripe is the order record. |
| Refund and cancellation policy page | NOT WRITTEN | Owner and counsel decision; see LEGAL_REVIEW_FLAGS.md (outside this repo). |
