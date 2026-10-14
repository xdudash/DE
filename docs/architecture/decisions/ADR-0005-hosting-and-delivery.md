# ADR-0005: Hosting and delivery — Vercel + GitHub Actions

- Status: Accepted (Vercel project is created in P2 with explicit owner authorization; nothing is deployed by this PR)
- Date: 2026-10-12

## Context
Need preview deployments per PR, global CDN for static content pages, zero server maintenance, EU-friendly data handling, low cost at 1,000+ users, and an exit path.

## Options considered
- **Vercel** — first-class Next.js support, PR previews, CDN; the free Hobby plan is for non-commercial use, so a paid plan is required before monetised launch (verify current terms at provisioning).
- **Cloudflare Workers/Pages (OpenNext adapter)** — cheapest at scale, generous free tier; adapter adds friction and occasional Next.js feature gaps.
- **Netlify** — similar to Vercel, slightly weaker Next.js parity.
- **Self-host (container on Hetzner/Fly)** — cheapest fixed cost, but ops/patching/monitoring burden on the founder.

## Decision
**Vercel** for the app (functions pinned to an EU region when server code arrives), **GitHub Actions** for CI. Static generation for content keeps function usage low. Revisit if monthly hosting cost exceeds €100 or a required feature is blocked; Cloudflare/OpenNext or a container are the documented exits.

## Consequences
- + Minimal ops; previews make content review easy for non-developers.
- − Vendor pricing changes; mitigated by standard Next.js and no Vercel-specific storage products.

## Verification
P2: preview deployment per PR; production deploy only from `main` after required checks; rollback via instant redeploy of the previous build documented in [operations](../../quality/OPERATIONS.md).
