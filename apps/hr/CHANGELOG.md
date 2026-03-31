# hr

## 0.2.1

### Patch Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.
- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/auth@0.3.0
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/supabase-tanstack-db-integration@0.2.1
  - @mcmec/ui@1.4.3

## 0.2.0

### Minor Changes

- 501ef75: Add HR app for employee management with employees CRUD, invite flow, and TanStack Table. Update app registry with cross-app URLs. Fix layout logo to use Supabase Storage. Add employees RLS policies and manage_employees permission. Add TanStack DB skill mappings to CLAUDE.md.

### Patch Changes

- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
- Updated dependencies [9e06271]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2
  - @mcmec/supabase-tanstack-db-integration@0.2.0
  - @mcmec/auth@0.2.1
