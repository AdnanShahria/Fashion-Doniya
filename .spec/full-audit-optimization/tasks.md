# Implementation Tasks Checklist

- [x] Stage 1 & 2: Repository indexed with `codebase-memory-mcp` + 3 read-only audit subagents completed.
- [ ] Stage 3: Spec-Kit SDD artifacts (`spec.md`, `plan.md`, `tasks.md`).
- [ ] WS-1: Auth lifecycle hardening (`auth-helper.ts`, `auth.ts`, `sysadm.ts`, `customers.ts`, `commerce.ts`, `ai.ts`, `seed.ts`).
- [ ] WS-2: Orders inventory reconciliation, customer stats, courier webhook hardening, coupon table sync, and mappers (`mappers.ts`, `orders.ts`, `courier.ts`, `system.ts`).
- [ ] WS-3: Unicode-safe `slugify`, product auto-SEO + IndexNow ping, R2 SEO filenames, `edge-seo.ts`, `edge-handlers.ts`, `functions/_middleware.ts`, `functions/product/[[slug]].ts`, `functions/category/[[slug]].ts`, `functions/api/app.ts` SSR parity.
- [ ] WS-4: Frontend auth/session verification, dedicated auth routes, async verified checkout, custom measurement inputs, crawlable `<Link>` navigation, client `<head>` + JSON-LD sync, and admin panel fixes.
- [ ] Stage 5: Automated auth/security tests (`scripts/test_auth_and_security.ts`), Edge SSR/SEO & commerce tests (`scripts/test_edge_ssr_and_seo.ts`), `bun run lint`, `bun run build`, live app verification, and `codebase-memory-mcp` re-index.
