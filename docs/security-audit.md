# Security and privacy audit — Milestone 9

## Scope
Every Supabase table, API route, server helper, form, upload path and admin action was reviewed against the checklist in the milestone request.

## Findings and fixes

| Area | Finding | Fix |
|---|---|---|
| RLS | All 15 application tables already had RLS; no anon write policies found. | Added automated pgTAP assertions in `supabase/tests/security_test.sql`. |
| IDOR — events | Event hosts could not read their own draft events because `events_select` only allowed published or moderator. | Migration `0013_security_hardening.sql` adds `events_select_host`. |
| CSRF | Mutating route handlers relied only on SameSite cookies. Next 16 also deprecates `middleware.ts`. | Central Origin-header guard in `src/proxy.ts` (Next 16 proxy convention) for POST/PATCH/PUT/DELETE. Verified bad-origin PATCH returns 403. |
| Mass assignment | Profile PATCH accepted untyped input and passed `visibility` through unchecked. | Added `editableProfileSchema` (Zod) and used `safeParse` in `/api/profile`. |
| Insecure upload | Uploads trusted the client-supplied MIME type. | Magic-byte signature validation added to `/api/gallery` before storage upload. |
| Sensitive data | Service-role key accessor lived in a shared env module. | Moved key read into `src/lib/supabase/admin.ts` with `import "server-only"`; removed from shared env. |
| Audit noise | Owners deleting their own gallery item attempted an admin-only audit RPC. | Audit call now only runs for admins. |
| Rate limits | Account deletion had no rate limit. | Added 3/hour per user. |
| Headers | Missing CSP and HSTS. | Added strict CSP (no wildcard sources), HSTS in production, expanded Permissions-Policy in `next.config.ts` and `vercel.json`. |
| XSS | Reviewed all user-content rendering. Markdown uses `react-markdown` (raw HTML disabled by default); no `dangerouslySetInnerHTML` anywhere. | No change needed; documented. |
| Secrets | Checked built client chunks in earlier milestones; service-role key absent. `server-only` import now enforces this at build time. | Enforced. |
| Analytics/trackers | None present. | No change. |

## Policies and documentation added
- `/privacy` — expanded cookie/data policy, providers and retention.
- `/terms` — terms of use.
- `/conduct` — code of conduct.
- `/security` — private vulnerability reporting and placeholder contact.
- `/data-request` — data deletion request flow.
- `/admin/settings` — audit log viewer (admin-only).
- `vercel.json` — secure deployment headers.

## Residual risks / limitations
- Discord OAuth credentials are still not configured, so authenticated end-to-end flows cannot be exercised yet.
- The rate limiter is in-memory per process; for multi-instance production, move it to Postgres or Redis.
- Next.js requires `'unsafe-inline'` for inline bootstrap scripts/styles under CSP; no wildcard source is used.
- The security contact email is intentionally `REPLACE_BEFORE_LAUNCH` until provided by the owner.
