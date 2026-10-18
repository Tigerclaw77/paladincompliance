# Subscriber benefits: operation and scheduling

Nothing here is scheduled or deployed by this repository. All three jobs are local code that needs (a) the additive migration `20261017180000_add_subscriber_benefits` applied by the operator, and (b) for emails, a real outbound email provider.

## Email provider requirement

Revision notices and renewal reminders send through nodemailer using the same settings NextAuth uses for magic links: `EMAIL_SERVER` (SMTP URL), `EMAIL_FROM`, optional `EMAIL_REPLY_TO` (defaults to the public contact address). If `EMAIL_SERVER` is missing or points at localhost, both jobs refuse to send and record nothing (so nothing is silently marked as sent). Check readiness with the admin page `/admin/revisions` (warns when unconfigured) or a `dryRun` call of the cron endpoint.

## 1. Annual binder revision + notification

- Admin (allowlist in `PALADIN_ADMIN_EMAILS`) opens `/admin/revisions`, enters version, title, summary and optional change list, and publishes.
- The revision is stored (`BinderRevision`) and appears on every member's Updates page.
- Owners and admins of organizations whose subscription is `active` or `trialing` are emailed once each. Sent notices are recorded (`BinderRevisionNotice`, unique per revision and email). Re-publishing the same version only emails people who have not received it; failed sends are not recorded and are retried.
- No scheduling: an annual revision is a human release action.

## 2. Renewal reminders (30 days before)

- Endpoint: `GET` or `POST /api/cron/renewal-reminders` with `Authorization: Bearer $CRON_SECRET` (minimum 16 characters; if unset the endpoint returns 503 and does nothing). `?dryRun=1` lists what would be sent without sending or recording.
- Finds `active`/`trialing` subscriptions whose `currentPeriodEnd` falls in the window now+27 days to now+30 days (a 3-day catch-up so a missed daily run does not skip anyone), skips subscriptions with `cancelAtPeriodEnd`, emails owners/admins, and records `RenewalReminder(subscriptionId, periodEnd, email)`. A unique key on those three columns prevents duplicates, and each new renewal period gets its own reminder.
- How it would be scheduled (choose one; none is configured):
  - Vercel Cron: add `{"crons":[{"path":"/api/cron/renewal-reminders","schedule":"0 14 * * *"}]}` to `vercel.json`. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the `CRON_SECRET` env var exists.
  - Any external scheduler (GitHub Actions, cron on a server): `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/renewal-reminders` once a day.
  - Run it daily; more frequent runs are harmless because of the dedupe key.

## 3. Annual AI spend summary and account persistence

- Recommendation (implemented): new Prisma model `AiSpendEntry` keyed to `Organization` (cascade delete), unique on `(organizationId, clientId)` so the browser's local entry ids map one-to-one to rows. This is the simplest option consistent with the existing Prisma + NextAuth model: no new auth concepts, no file storage, no external service.
- Authorization: the organization is always derived from the NextAuth session's first membership (the same rule as `getCurrentOrganization`); the request never supplies an organization id. Any member may read and export. Only OWNER/ADMIN may save or delete. JSON content type is required for writes. Per-field length limits, a 500-entry batch cap and a 5000-entry per-organization cap apply.
- Browser-local mode is unchanged: entries still live in localStorage and the existing CSV export works. "Save to account" upserts (never deletes); "Load from account" merges by id; removing an entry locally also deletes it from the account for owners/admins.
- Exports: `GET /api/spend-record/export?kind=summary|log&start=YYYY-MM-DD` (CSV, CSV-injection-safe) and a printable page at `/dashboard/spend-record/annual?start=YYYY-MM-DD` (browser print / save as PDF).
- Not done: server-side edit of individual entries, per-fiscal-year locking, audit trail of who changed what (only `createdByUserId` is stored), attachments of invoices.

## Applying the migration (operator action, not run here)

`prisma migrate deploy` against the target database after review. The SQL is create-only (4 tables, indexes, 2 foreign keys); nothing existing is altered or dropped. No migration was run against any database in this work.
