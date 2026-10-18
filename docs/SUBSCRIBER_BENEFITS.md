# Member benefits: operation and scheduling

Nothing here is deployed or scheduled by this repository alone. The jobs are local code that needs (a) the additive migrations `20261017180000_add_subscriber_benefits` and `20261018000000_add_recurring_value` applied by the operator, (b) a real outbound email provider for emails, and (c) `CRON_SECRET` set for the scheduled job.

What a member gets, and what is honestly not offered, is listed in `docs/FEATURE_STATUS.md`.

## Email provider

All emails send through nodemailer using the settings NextAuth uses for magic links: `EMAIL_SERVER` (SMTP URL), `EMAIL_FROM`, optional `EMAIL_REPLY_TO` (defaults to the public contact address). If `EMAIL_SERVER` is missing or points at localhost, the jobs refuse to send and record nothing, so nothing is silently marked as sent. Connection and socket timeouts (10 s and 20 s) keep a stuck SMTP server from hanging a cron run.

Recommended production provider: Resend over SMTP (`smtps://resend:<api key>@smtp.resend.com:465`), with the sending domain verified (SPF, DKIM, DMARC). Zoho SMTP also works but has low daily limits and no bounce webhooks. See `LAUNCH_DECISION.md` (outside this repo) for the reasoning.

### Templates, footer, and unsubscribe

`src/lib/paladin/email/templates.ts` renders every non-auth email: plain text plus simple branded HTML, a one-sentence reason for receiving the message, a contact line, and the disclaimer footer ("documentation and records only; not legal advice, a certification, an audit, or a guarantee of compliance").

Two kinds exist:

- Transactional (renewal notice about the member's own billing): no unsubscribe link required.
- Reminder (compliance calendar reminders, revision notices): must carry an unsubscribe URL. The renderer throws if one is missing. Messages include `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058).

Unsubscribe tokens are stateless HMACs of the lower-cased address, keyed by `AUTH_SECRET` (`src/lib/paladin/email/unsubscribe.ts`). `GET /unsubscribe?e=&t=` shows a confirmation; `POST` (including the one-click POST) records an `EmailOptOut` row. Opted-out addresses are skipped by calendar reminders and revision notices. They still receive sign-in links and billing notices because those are transactional.

### Volume cap, dedup, and logging

- `PALADIN_MAX_EMAILS_PER_RUN` (default 50) is a per-run budget shared by all jobs. Messages over the cap are not sent and not recorded, so the next run picks them up.
- A dedup row is written only after a successful send: `RenewalReminder`, `ComplianceReminder` (unique on organization, event, due date, email), `BinderRevisionNotice`. Failed sends are retried on the next run.
- Every run logs one structured line with counts (sent, failed, already sent, opted out, capped). Addresses are not logged.

## Scheduled job

`vercel.json` contains one cron entry: `GET /api/cron/daily` at 14:00 UTC (09:00 America/Chicago during daylight time). It requires `Authorization: Bearer $CRON_SECRET` (minimum 16 characters; if unset the endpoint returns 503). Vercel sends that header automatically when the `CRON_SECRET` environment variable exists. `?dryRun=1` previews counts without sending or recording.

The daily job runs, in order: renewal reminders, then compliance calendar reminders. Vercel's Hobby plan allows one run per day with up to a one hour timing window, which is enough for these jobs, but Hobby is restricted to non-commercial use, so a paying business should use Pro (see LAUNCH_DECISION.md). Any external scheduler also works: `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/daily` once a day. More frequent runs are harmless because of the dedup keys.

`/api/cron/renewal-reminders` still exists for running only that job.

## Benefit details

### Annual binder revision and log
Admins (`PALADIN_ADMIN_EMAILS`) publish from `/admin/revisions`. Revisions are append-only: a version that already exists with different content is rejected with a conflict (nothing is overwritten), and publishing needs an explicit confirmation checkbox. Members see the log at `/dashboard/updates`. Notices go once per active subscriber (owners and admins), skipping opted-out addresses.

### Renewal reminders (30 days before)
Window now+27 to now+30 days on `currentPeriodEnd`; skipped when `cancelAtPeriodEnd`. Dedup by subscription, period end, and email. This is a transactional billing notice.

### Compliance calendar
`/dashboard/calendar` and `GET /api/calendar/ics` (session-authenticated, organization from the session). Dates derive from the membership period (`currentPeriodStart` / `currentPeriodEnd`): quarterly AI tool inventory review, semiannual vendor review, annual training refresh, policy review, spend record review, and renewal. Reminder emails go 7 days before each event. Past events are not shown. If a subscription has no period dates yet, the calendar is empty rather than invented.

### Training acknowledgments
Three short modules (AI acceptable use, data handling, incident reporting) with real content at `/dashboard/training`. An owner or admin records that a named person read a module, with a date. Records are per organization (`TrainingAcknowledgment`), CSV export at `/api/training/export`. There is no quiz, per-person login, or certificate; the wording is "acknowledgment", never "certification". Acknowledgments are treated as current for 12 months.

### Review checklists
`/dashboard/reviews`: AI tool inventory review and AI vendor review. Owners and admins save a dated record (`ReviewRecord`, reviewer name, items checked, notes). CSV export at `/api/reviews/export`.

### AI spend record and annual summary
Unchanged: browser-local by default; "Save to account" stores entries in `AiSpendEntry` for the organization (owners and admins write, all members read). Exports at `/api/spend-record/export`, printable page at `/dashboard/spend-record/annual`. Local-only entries are lost if the browser data is cleared; only saved entries are on the account.

### Quick-reference record PDF
`GET /api/assets/quick-reference` generates the 13-page PDF on demand (no file storage), for members with the entitlement. Production file storage is not configured and is not needed.

## Order alert for the owner
Binder and Starter orders are fulfilled by hand. If `PALADIN_ORDER_NOTIFY_EMAIL` is set and email is configured, the Stripe webhook sends the owner one plain-text message per paid binder or Starter checkout (item, quantity, amount, ship-to). It is best effort: a failure is logged and never fails the webhook. The Stripe dashboard remains the order record.

## Applying the migrations (operator action, not run here)

`prisma migrate deploy` against the target database after review. Both migrations are create-only (new tables, indexes, foreign keys); nothing existing is altered or dropped. They were applied successfully to an in-memory Postgres (PGlite) as a syntax check only; they have not been run against Neon or any real database.
