---
"api": minor
"central": minor
"@mcmec/domain": minor
"@mcmec/schemas": minor
---

HR can announce Staff Events — webinars, training dates — for every Employee: a `staff_events` table with five commands (`employees.createStaffEvent`, `updateStaffEventDetails`, `cancelStaffEvent`, `uncancelStaffEvent`, `deleteStaffEvent`) under `manage_employees`, readable by every signed-in Employee. HR's Staff Events screens offer Cancel Event / Reinstate on the list, the detail view and the edit form (as Save and… when the form has changes).
