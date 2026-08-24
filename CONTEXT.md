# MCMEC

The Middlesex County Mosquito Extermination Commission is a New Jersey county agency that
controls mosquito populations and publishes what it does to the public. This glossary is the
ubiquitous language for that work — the terms the code, the issues and the interfaces should
all use.

Terms are grouped by the domain that owns them. A domain here is a bounded context: it is
named for the work, never for the app the work happens in.

## Language

### Commands

**Command**:
A named write, carrying everything needed to perform it. Every change to MCMEC data is one.
_Avoid_: mutation, action, operation

**Domain**:
A group of commands owned by the same part of the business, and the one permission every
command in it requires. There are four: Website, Employees, Users, Reference.
_Avoid_: module, area, bounded context (in prose — the term of art, but not what we call one)

**Intent**:
The command a pending change means, recorded alongside it so the change survives the trip to
the server as something more than a set of altered fields.

**App Role**:
A capability granted to a person's login, and the same string a command names as its
permission. One per staff surface: `manage_website`, `manage_employees`, `manage_users`,
`manage_reference_data`.
_Avoid_: permission (when the granting is meant), group, access level

**Audit Entry**:
The immutable record of a single change — who made it, when, from where, what the row was
before and after, and which command they meant.
_Avoid_: log, history, revision

---

### Website domain

Everything the public sees, and the requests the public sends back. Requires `manage_website`.

**Notice**:
A dated public announcement, some of which are legal notices the Commission is required by
statute to post.
_Avoid_: post, article, announcement, bulletin

**Notice Category**:
A grouping a Notice belongs to. Named by the Commission, not fixed in code.
_Avoid_: notice type, tag, topic

**Published**:
Visible on the public website. A Notice, Document or Job Posting is either Published or a
Draft; nothing is partly published.
_Avoid_: live, active, public

**Draft**:
Created but not visible to the public. The state everything starts in unless the author
chooses otherwise.
_Avoid_: unpublished (as a noun), hidden, pending

**Archived**:
A Notice moved off the current notices page while remaining on the public record. Distinct
from deleted, and distinct from unpublished — an Archived Notice was and remains public.
_Avoid_: expired, retired, closed

**Retention Period**:
The seven days a legal Notice must remain on the current notices page before it may be
Archived, under P.L. 2025 c.72.

**Meeting**:
A scheduled public meeting of the Commission, with its agenda notice and, afterwards, its
minutes. A Meeting that will not take place is Cancelled rather than deleted, because the
public record must show it was called.
_Avoid_: event, session

**Cancelled**:
Of a Meeting: called but not held. A Cancelled Meeting stays on the public meetings page and
carries the reason in its notes.

**Document**:
A file the Commission publishes for transparency — budgets, reports, audits — identified by
its fiscal year and hosted elsewhere.
_Avoid_: file, attachment, record

**Document Category**:
A grouping a Document belongs to.
_Avoid_: document type, folder

**Insecticide**:
A mosquito-control product the Commission uses, published with its active ingredient, label
and safety data sheet. Catalogue only — listing one is not a record of applying it.
_Avoid_: pesticide, chemical, product

**Spray Mission**:
A planned adulticide application: a date, a time window, an area, an Insecticide, and the
Municipalities it covers.
_Avoid_: spray schedule, spray event, treatment, application

**Mission Status**:
Where a Spray Mission stands — Scheduled when created, then Delayed, Cancelled or Completed.
A Delayed mission carries a rain date.

**Weekly Mosquito Activity**:
Trap counts and rainfall by species, week and year, loaded a season at a time. Loading a
season replaces every record for the years in it.
_Avoid_: mosquito data, surveillance data, trap data

**Public Request**:
Something a member of the public asks the Commission to do or answer, submitted anonymously
from the public website. Four kinds: general inquiry, adult mosquito nuisance, water
management, and mosquitofish.
_Avoid_: service request, ticket, complaint, submission

**Resolved**:
Of a Public Request: dealt with. A Public Request is either New or Resolved — the Commission
does not track work in progress on one.

**Job Posting**:
An open position advertised on the public website. Website content, authored by whoever
manages the website, even though the role being advertised is an HR concern.
_Avoid_: job listing, vacancy, opening, job ad

**Closed**:
Of a Job Posting: no longer accepting applicants, and hidden from the public site. Distinct
from unpublished — a Closed posting was advertised and the advertisement ended.

---

### Employees domain

The people who work for the Commission, and their access to the staff applications. Requires
`manage_employees`.

**Employee**:
A person employed by the Commission. An Employee exists whether or not they can sign in to
anything.
_Avoid_: staff member, worker, personnel

**User**:
A login. Distinct from an Employee: the Employee is the person, the User is their means of
signing in, and an Employee may have none.
_Avoid_: account, member, profile

**Invite**:
Giving an Employee a User and sending them the link to set their password. An Employee can
be invited once.
_Avoid_: onboard, provision, register

---

### Users domain

Who may do what across the staff applications. Requires `manage_users`.

**Grant** / **Revoke**:
Giving or taking away one App Role from one User. Always one role at a time — the set is
never replaced wholesale.
_Avoid_: assign, set roles, update permissions

---

### Reference domain

Slow-changing data the rest of the Commission's work refers to. Requires
`manage_reference_data`.

**Municipality**:
One of the towns in Middlesex County the Commission serves. Spray Missions name the
Municipalities they cover.
_Avoid_: town, borough, city, locality
