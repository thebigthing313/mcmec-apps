## Summary
<!-- What changed and why? -->


## Checklist
- [ ] Tested locally (`pnpm dev` / `pnpm --filter api db:migrate` if migrations changed)
- [ ] Types pass (`pnpm check-types`)
- [ ] Changeset added (`pnpm change`) — or N/A for config/CI-only changes
- [ ] No new env vars without updating `.env.example`
- [ ] No secrets committed

### If this PR includes Drizzle migrations:
> **Warning:** Migrations auto-apply on deploy — to staging on merge to `develop`, and to the production database on merge to `main`.

- [ ] Migration generated with `pnpm --filter api db:generate` (not hand-written)
- [ ] Migration applied and tested against staging
- [ ] Migration is backwards-compatible (no destructive column/table drops without coordination)
