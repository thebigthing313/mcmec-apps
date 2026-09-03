---
"public": patch
---

Put **Service Request** back on the public site, and rename Contact Us to **General Inquiries**.

#212 renamed the public-facing language to "Public Request" on the strength of CONTEXT.md's
`_Avoid_: service request` line. That was the wrong direction: Public Request is the internal
name for the concept, and residents read "Service Request". The menu, the footer, the contact
sidebar, the request hub and the two surveillance pages all say it again, the home-page button
reads "Request Service", and the request hub and all three intake forms carry their original
copy — including "the Commission does not accept anonymous requests", which is accurate, since
every intake form requires a name and a phone number.

The general contact page is now **General Inquiries**, named that in the nav, the footer and
the contact sidebar, and its page leads with what it is for — questions about the program —
and points anyone reporting a problem at the service request form instead.

CONTEXT.md records the split so this does not get "corrected" a third time: the glossary entry
keeps Public Request as the internal term and now names the public labels next to it, drops
`service request` from its `_Avoid_` line, and stops describing a Public Request as anonymous.

Accessibility work from #212 and #209 is untouched: the option cards stay `h2`s, the office
number stays a `tel:` link, no link is labelled "here", and the forms keep their `aria-required`
markers.
