---
"api": minor
---

Audit log records the named domain command behind each write

`audit_log` gains a nullable `command` column, populated by `log_mutation()` from a new
`app.command` GUC that `setCommand(tx, command)` stamps per command inside the transaction.
Existing write paths set nothing and log a null command, exactly as before.
