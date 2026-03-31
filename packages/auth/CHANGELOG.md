# @mcmec/auth

## 0.3.0

### Minor Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.

### Patch Changes

- 8dc9b46: Migrate notices app to supabase-tanstack-db-integration via collection factory in @mcmec/supabase. Remove individual collection files, add unified db.ts with getDb()/useDb() singleton pattern. Remove fetch functions and SupabaseClient imports from schema files (pure Zod). Deduplicate supabase-js and react-router versions via pnpm overrides. Align supabase-js to ^2.100.1 across all packages.
- Updated dependencies [b9b91e2]
  - @mcmec/lib@0.7.3

## 0.2.1

### Patch Changes

- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2

## 0.2.0

### Minor Changes

- a8b88f5: New @mcmec/auth package with typed errors, canonical Claims type, and dependency injection pattern. Update PasswordSchema minimum from 8 to 6 characters.

### Patch Changes

- Updated dependencies [a8b88f5]
  - @mcmec/lib@0.7.1
