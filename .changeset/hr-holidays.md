---
"api": minor
"central": minor
"@mcmec/domain": minor
"@mcmec/schemas": minor
"@mcmec/lib": minor
"@mcmec/ui": minor
---

HR can enter the Commission's Holidays: a `holidays` table with three commands (`employees.createHoliday`, `updateHoliday`, `deleteHoliday`) under `manage_employees`, readable by every signed-in Employee. HR's Holidays screen lists one year at a time and refuses a second Holiday on a day already closed. Constraint violations caught by command handlers now return their intended 409/422 instead of a 500.
