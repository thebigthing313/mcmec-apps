---
"public": minor
---

Call a Public Request a Public Request, and stop telling residents it cannot be anonymous

Two copy defects on the public site, both measured against `CONTEXT.md` rather than taste.

**The binding term appeared nowhere.** `CONTEXT.md` defines **Public Request** and lists "service request" in its `_Avoid_` line, yet the public site said Service Request or Request Service in ten places: the home page card, the footer quick link, the nav group, the contact-section sidebar, the page title, the `h1`, the hub and general-inquiry body copy, and the two cross-links from the surveillance pages. The route `/contact/service-request` is unchanged — the URL is legacy and links to it keep working; only the visible language moves.

Also renamed for the same reason: the third option card was "Interested in Mosquitofish" while its siblings were "Adult Mosquito Nuisance" and "Water Management", which are the kind names verbatim. It is "Mosquitofish" now. The general inquiry form's two toasts said "Submission successful" — *submission* is on the same `_Avoid_` line — and now say "Thank you — your message has been sent." The Adult Mosquito Nuisance page carried the same noun ("our team will review your submission"); it reviews your *request* now.

**The site told residents their request could not be anonymous.** `CONTEXT.md` says a Public Request is "submitted anonymously from the public website", and the product carries no login, no account and no status lookup. The hub page said the opposite — *"Please note that we do not accept anonymous requests"* — as the second sentence a resident read, before seeing any form, where it lands as a gate rather than as information. The same sentence sat in the Contact Information block of all three intake forms.

What the forms actually need is a phone number so an inspector can reach someone if they cannot find the problem, which is what they say now: "We ask for your name and phone number so an inspector can reach you if they cannot find the problem. There is no account to create and no password to remember."

The hub page's closing paragraph is rewritten too: the office number is a `tel:` link instead of plain text, and the general contact form is reached through the words "general inquiry" rather than through a link labelled "here" (WCAG 2.4.4).

**One adjacent fix**, in the same element being renamed: the three option cards on the hub carried their titles in `div`s, so the whole choice the page offers was absent from the heading outline. They are `h2`s now, with `mt-0` holding prose's heading margin off so the cards keep the spacing they had.
