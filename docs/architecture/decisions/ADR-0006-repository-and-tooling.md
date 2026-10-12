# ADR-0006: Repository and tooling — one monorepo, npm workspaces, Node 22, TypeScript strict

- Status: Accepted (implemented in this PR)
- Date: 2026-10-12

## Decision
- Single repository `xdudash/DE` containing docs, content, `packages/*`, `apps/*` (npm workspaces). No Turborepo/Nx until build times demand it.
- Node 22 LTS (type-stripping lets content tooling run TypeScript without a build step); TypeScript strict with `erasableSyntaxOnly` in packages.
- Tests: `node:test` for content-kit (zero extra dependencies); app logic tests and Playwright E2E added in P2.
- Required CI: foundation check (Python stdlib), content validation, tests, typecheck, web build.
- Dependencies are few and justified: `yaml`, `ajv`, `ajv-formats`, `next`, `react`. A lockfile is committed (DG-011).

## Alternatives
pnpm (faster, stricter) — reasonable later switch; Bun — less mature for this stack; separate repos for content/app — rejected (cross-repo versioning burden for one person).

## Consequences
One clone gives Claude Code the full context; changes to contract + content + app land atomically in one PR.
