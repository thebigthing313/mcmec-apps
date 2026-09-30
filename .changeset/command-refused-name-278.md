---
"central": patch
---

A test now ties `CommandRefusedError` to the name `@mcmec/ui`'s `toastOnError` recognises it by. Renaming it on either side now fails CI, instead of silently replacing the server's refusal sentence with the generic error toast (#278).
