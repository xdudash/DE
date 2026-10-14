# ADR-0001: Application platform — Next.js + TypeScript web/PWA first, Capacitor for store apps

- Status: Accepted
- Date: 2026-10-12
- Decision owner: Project owner (decision prepared by Claude; owner approves via PR merge)

## Context
One founder, AI-assisted development, content-heavy product (long explanations, tables, reading texts), multilingual incl. RTL, must work on web and phones, needs SEO for acquisition (public concept pages), offline tolerance, later audio recording and store presence.

## Options considered
| Criterion | A. Next.js + TS (web/PWA → Capacitor) | B. Expo / React Native (+ RN Web) | C. SvelteKit (PWA → Capacitor) | D. Flutter |
|---|---|---|---|---|
| Solo maintenance | One codebase, web-native rich text | One codebase, but RN Web weaker for long-form content | One codebase, simpler framework | One codebase, non-web-native text |
| SEO / static content pages | Excellent (SSG) | Weak | Excellent | Poor |
| Ecosystem maturity | Very large | Large | Medium | Large (mobile) |
| Claude Code familiarity | Very high | High | Medium | Medium |
| Native features (audio, IAP) | Via Capacitor plugins | Best | Via Capacitor | Best |
| Lock-in | Next is open source; self-hostable | Expo services optional | Low | Low |
| Accessibility on web | Native HTML semantics | RN Web abstractions | Native HTML | Canvas-based on web |

## Decision
**A.** Next.js (App Router) + TypeScript strict, mobile-first responsive web app with PWA manifest; native store apps later by wrapping the same app with Capacitor when speaking/offline/store presence justify it (P8). React Server Components and static generation keep content pages cheap and indexable.

## Consequences
- + Single codebase, highest AI-assistance quality, SEO, accessibility via HTML.
- − Native-heavy features (background audio, fine-grained recording) need Capacitor plugins; iOS PWA limits until wrapped.
- − Next.js major upgrades require periodic maintenance (budget a task per major).

## Verification
CI builds static pages for every language × unit (implemented). P2: Lighthouse mobile performance ≥ 90 on lesson pages, axe without serious violations. P8: Capacitor spike before committing store releases.
