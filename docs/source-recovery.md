# Production source recovery

The application source in this repository was recovered on 2026-09-02 from
Vercel production deployment `dpl_2sKyz4eSp5jxf6JezknSP6n8Vqo7` for project
`prj_97uonGHNNqoZd1bWZSlrbUOhIZMK`.

Vercel identifies the deployment as a CLI deployment from the repository
`Tigerclaw77/paladincompliance`, branch `main`, at commit
`efc97e4725a666fe5d3f40234ff140b22dc0c65a` ("Fix public page SEO canonicals").
That commit no longer exists in the local repository or on GitHub, so Vercel's
immutable uploaded source-file snapshot is the recovery authority.

The recovery copied the application source, public assets, Prisma schema and
migrations, scripts, documentation, and root build configuration. It
intentionally excluded uploaded environment files, the local development
database, generated build output, TypeScript build state, and binder document
rendering artifacts. Secrets remain configured in Vercel and are not stored in
Git.

The recovered snapshot contained 170 selected source/build-input files. Key
files were verified against the SHA-1 identifiers in Vercel's deployment
manifest, including `package.json`, `/order`, the pricing client, Stripe price
IDs, Checkout session creation, and Stripe webhook processing.
