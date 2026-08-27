---
"@mcmec/ui": patch
"website-management": patch
"public": patch
---

Give insecticides the detail page and danger zone ADR 0001 requires

The insecticide commands were cut over before ADR 0001 settled, so `website.deleteInsecticide`
landed correctly named but still fired from a plain destructive button at the bottom of the edit
form. `insecticides/$insecticideId.tsx` splits into a read-only detail page and
`$insecticideId_.edit.tsx`, matching the shape every other table in the app now has.

**This is the case that shows the detail page is not about lifecycle.** Insecticides have no
lifecycle columns, so the page carries no `LifecycleButton` and the edit form takes no `actions`
render prop — `website.updateInsecticideDetails` is the only command the form can send. The page
exists because `delete*` is the one command whose placement ADR 0001 does not leave free: detail
page only, in a `DangerZoneCard`, behind a confirm. The refusal is unchanged — a spray mission
still naming the product comes back as a 409 saying which one.

`InsecticidesTable`'s `linkToEdit` prop becomes `linkToDetail`, following the rename the meetings
slice made for the same reason: the row now opens the record, not the form. `apps/public` passes
it `false` and is otherwise untouched.
