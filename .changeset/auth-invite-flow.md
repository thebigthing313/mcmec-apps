---
"central": minor
"notices": patch
---

Rework auth flow to use email-based invites via Resend SMTP. Replace create-account edge function with invite-employee. Add set-password, forgot-password, and reset-password pages to central. Update both apps to use @mcmec/auth package with typed errors.
