## Summary
<!-- What changed and why? -->


## Checklist
- [ ] Tested locally (`pnpm dev` / `supabase db reset` if migrations changed)
- [ ] Types pass (`pnpm check-types`)
- [ ] Changeset added (`pnpm change`) — or N/A for config/CI-only changes
- [ ] No new env vars without updating `.env.example`
- [ ] No secrets committed

### If this PR includes Supabase migrations:
> **Warning:** Migrations auto-apply to the production database when merged to `main`.

- [ ] Migration tested locally with `supabase db reset`
- [ ] Migration is backwards-compatible (no destructive column/table drops without coordination)
