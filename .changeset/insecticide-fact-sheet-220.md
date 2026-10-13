---
"api": minor
"central": minor
"public": patch
"@mcmec/schemas": minor
"@mcmec/domain": minor
---

Insecticides store a fact sheet URL (#220). Staff add or change it from Website Management, and the public spray schedule reads it from the record instead of matching the Zenivex trade name. A migration carries the existing Zenivex fact sheet into the new column.
