---
"api": minor
"@mcmec/supabase": minor
"website-management": patch
---

Give `spray_schedule_municipalities` a surrogate `id` so the junction can sync as a collection.

**api** — migration `0003` drops the composite primary key, adds `id uuid primary key default gen_random_uuid()`, and keeps the pair unique via `spray_schedule_municipalities_pair_key`. Existing rows keep their pairs and pick up generated ids. Writes still go through `PUT /api/spray-schedules/:id/municipalities` — replacing a schedule's whole set is one transaction, not a series of row writes — but the short-lived `GET /api/spray-schedules/municipalities` added alongside it is gone, since clients now read the junction from its Electric shape.

**@mcmec/supabase** — new `SprayScheduleMunicipalitiesRowSchema` and a read-only `sprayScheduleMunicipalities` collection in the notices factory.

**website-management** — the spray-schedule screens read municipality links from the collection instead of polling an endpoint, so a municipality write syncs back on its own with no query invalidation.
