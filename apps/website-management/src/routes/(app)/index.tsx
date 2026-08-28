/*
 * DIRECTION CONTRACT — Website Management dashboard (seed e92950ed, form "The Signal Strip",
 * index 7 of 7 on the ranked list, dealt and locked; code-led build).
 *
 * THESIS: A staff dashboard is a place to start work, not a place to read numbers. This screen
 * refuses the four-stat-cards-over-four-list-cards arrangement it replaces, where every count was
 * a dead end and nothing said which of them mattered first.
 * OWN-WORLD: MCMEC unchanged — green-cast neutrals on hue 150, Roboto, flat, hairline Rule borders
 * carrying every division. Commission Green appears exactly once on a resting screen: the lit
 * signal. No shadow, no second family, no chart pastels.
 * STORY: Staff sign in, see what needs them ranked by consequence, open the one queue that matters
 * without leaving the page, act, and confirm the public record below.
 * FIRST VIEWPORT: One instrument. Five ruled signal cells across the full width — counts in tabular
 * figures over the queue's name and its condition — and directly beneath them, sharing the same
 * border, the open queue. The screen opens on the most consequential non-empty signal.
 * FORM: The Signal Strip. Signature interaction: the band is a real tablist; arrows move between
 * signals and the queue settles in under it. Motion grammar: one 200ms settle per switch, nothing
 * else moves.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
 * verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */

import {
	formatDateShort,
	getStartOfDayUTC,
	getTodayUTC,
	isAfterDay,
	isSameDay,
} from "@mcmec/lib/functions/date-fns";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { PublicNoticeBadge } from "@mcmec/ui/blocks/public-notice-badge";
import { type Signal, SignalBand } from "@mcmec/ui/blocks/signal-band";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import {
	CalendarCheck,
	CheckCircle2,
	FileText,
	Inbox,
	SprayCan,
} from "lucide-react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { type QueueItem, SignalQueue } from "@/src/components/signal-queue";
import {
	REQUEST_STATUS_LABELS,
	REQUEST_STATUS_VARIANTS,
	requestTypeLabel,
} from "@/src/lib/public-requests";
import { formatTimeRange, statusBadgeVariant } from "@/src/lib/spray-schedule";

/**
 * How long a Public Request may sit open before the dashboard calls it aging. Five working days is
 * the point where a resident who submitted a mosquito complaint starts to assume nobody read it.
 */
const AGING_DAYS = 5;

const MS_PER_DAY = 86_400_000;

/**
 * "12:00 PM" — the clock time of a meeting, local, without repeating the date that already sits in
 * the row's own date column. `formatDateTime` renders the whole weekday-date-time-zone sentence,
 * which is right on a detail screen and twice too long inside a queue row.
 */
function formatMeetingTime(at: Date): string {
	return at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export const Route = createFileRoute("/(app)/")({
	component: RouteComponent,
	// Every collection this page live-queries has to be preloaded — a live query against a
	// collection that never started syncing suspends forever, and there's no Suspense
	// fallback above it, so the whole app would render blank.
	loader: async ({ context }) => {
		await Promise.all([
			context.db.notices.preload(),
			context.db.publicRequests.preload(),
			context.db.meetings.preload(),
			context.db.spraySchedules.preload(),
			context.db.insecticides.preload(),
			context.db.documents.preload(),
			context.db.jobPostings.preload(),
		]);
		return { crumb: "Dashboard" };
	},
});

/** Whole days a record has been open, counted from UTC midnight so it can't drift by an hour. */
function daysOpen(since: Date, today: Date): number {
	return Math.max(
		0,
		Math.round(
			(today.getTime() - getStartOfDayUTC(since).getTime()) / MS_PER_DAY,
		),
	);
}

function RouteComponent() {
	const { db } = Route.useRouteContext();
	const now = getTodayUTC();

	// ---------------------------------------------------------------- spray missions
	// One joined query for every mission, split below. The alternative — a query per status —
	// re-derives the same join four times and still can't answer "what is on tonight".
	const { data: missions, isReady: missionsReady } = useLiveQuery((q) =>
		q
			.from({ s: db.spraySchedules })
			.innerJoin({ i: db.insecticides }, ({ s, i }) =>
				eq(s.insecticide_id, i.id),
			)
			.select(({ s, i }) => ({
				areaDescription: s.area_description,
				endTime: s.end_time,
				id: s.id,
				insecticideName: i?.trade_name ?? "",
				missionDate: s.mission_date,
				startTime: s.start_time,
				status: s.status,
			}))
			.orderBy(({ s }) => s.mission_date, "asc"),
	);

	const tonightMissions = missions.filter(
		(m) =>
			isSameDay(m.missionDate, now) &&
			(m.status === "scheduled" || m.status === "delayed"),
	);
	const delayedMissions = missions.filter(
		(m) => m.status === "delayed" && !isSameDay(m.missionDate, now),
	);
	const upcomingMissions = missions.filter(
		(m) => m.status === "scheduled" && isAfterDay(m.missionDate, now),
	);
	// Tonight first, then anything delayed and owed a new date, then what is coming. A mission that
	// was delayed three weeks ago is still unfinished work, so it outranks next Tuesday's.
	const missionQueue = [
		...tonightMissions,
		...delayedMissions,
		...upcomingMissions,
	].slice(0, 8);

	// ---------------------------------------------------------------- public requests
	const { data: allRequests, isReady: requestsReady } = useLiveQuery((q) =>
		q.from({ r: db.publicRequests }).orderBy(({ r }) => r.created_at, "asc"),
	);

	const openRequests = allRequests.filter((r) => r.status !== "resolved");
	const agingRequests = openRequests.filter(
		(r) => daysOpen(r.created_at, now) >= AGING_DAYS,
	);
	const newRequests = allRequests.filter((r) => r.status === "new");

	// ---------------------------------------------------------------- notices
	const { data: notices, isReady: noticesReady } = useLiveQuery((q) =>
		q.from({ n: db.notices }).orderBy(({ n }) => n.notice_date, "desc"),
	);

	const publishedNotices = notices.filter(
		(n) => n.is_published && !n.is_archived && !isAfterDay(n.notice_date, now),
	);
	const pendingNotices = notices.filter(
		(n) => n.is_published && !n.is_archived && isAfterDay(n.notice_date, now),
	);
	const draftNotices = notices.filter((n) => !n.is_published);
	// `notices` is ordered by notice_date descending, so the board's newest posting is the first
	// published one — the date a resident sees at the top of the public notices page.
	const newestNotice = publishedNotices[0];
	// Pending first: a Notice already published against a future date is committed and will appear
	// on its own, so it is the one whose text is about to stop being editable in practice.
	const unpublishedNotices = [...pendingNotices, ...draftNotices];

	// ------------------------------------------------- the public's published surface
	// These four are what a resident actually loads, and none of them appear in the band above —
	// which is the point. A register that reprints the instrument's counts confirms nothing.
	const { data: publishedDocuments } = useLiveQuery((q) =>
		q.from({ d: db.documents }).where(({ d }) => eq(d.is_published, true)),
	);

	const { data: insecticides } = useLiveQuery((q) =>
		q.from({ i: db.insecticides }),
	);

	const { data: openJobPostings } = useLiveQuery((q) =>
		q.from({ j: db.jobPostings }).where(({ j }) => eq(j.is_closed, false)),
	);

	// ---------------------------------------------------------------- meetings
	const { data: meetings, isReady: meetingsReady } = useLiveQuery((q) =>
		q
			.from({ m: db.meetings })
			.where(({ m }) => eq(m.is_cancelled, false))
			.orderBy(({ m }) => m.meeting_at, "asc"),
	);

	// The screen this replaces sorted these descending and titled the card "Upcoming Meetings",
	// so it showed the most recent past meetings under a heading promising the opposite.
	const upcomingMeetings = meetings.filter(
		(m) => !isAfterDay(now, m.meeting_at),
	);
	const nextMeeting = upcomingMeetings[0];

	// ---------------------------------------------------------------- the band
	// Ordered by consequence, left to right. Colour may not carry urgency here (DESIGN.md reserves
	// Commission Green for the active state and Refusal Red for destruction), so position, the
	// condition line, and which signal the screen opens on are what rank these.
	const signals: Signal[] = [
		{
			condition: tonightMissions.length
				? "scheduled tonight"
				: upcomingMissions[0]
					? `next ${formatDateShort(upcomingMissions[0].missionDate)}`
					: "none scheduled",
			count: tonightMissions.length,
			id: "missions",
			label: "Missions tonight",
			panelLabel: "Spray Missions tonight",
		},
		{
			condition: `open ${AGING_DAYS}+ days`,
			count: agingRequests.length,
			id: "aging",
			label: "Requests aging",
		},
		{
			condition: "awaiting triage",
			count: newRequests.length,
			id: "new-requests",
			label: "New requests",
		},
		{
			condition: unpublishedNotices.length
				? `${draftNotices.length} draft, ${pendingNotices.length} pending`
				: "everything is published",
			count: unpublishedNotices.length,
			id: "notices",
			label: "Not yet public",
		},
		{
			condition: nextMeeting
				? `next ${formatDateShort(nextMeeting.meeting_at)}`
				: "none scheduled",
			count: upcomingMeetings.length,
			id: "meetings",
			label: "Upcoming meetings",
		},
	];

	// Open on the most consequential signal that actually has something in it, so a staff member
	// who signs in during a spray week lands on tonight's mission and one who signs in in February
	// lands on whatever is genuinely outstanding.
	//
	// Derived rather than seeded into state: the collections are preloaded but the live queries
	// still settle across a render or two, and a `useState` initialiser froze whichever snapshot
	// won the first paint — which is how this screen opened on the emptiest signal in the band.
	// Once the user picks, their choice wins and the derivation stops mattering.
	const [pickedSignal, setPickedSignal] = useState<string | null>(null);
	const derivedSignal = signals.find((s) => s.count > 0)?.id ?? "missions";
	const openSignal = pickedSignal ?? derivedSignal;

	// The auto-open is a load-time affordance, not a live one, and the distinction is load-bearing
	// in both directions.
	//
	// It cannot commit on the first tick that has any work in it: `publicRequests` is an on-demand
	// collection that syncs incrementally, so the eager ones land first and a commit that fires on
	// "something is non-zero" freezes on whichever queue won the race — which is how this screen
	// twice opened on Upcoming meetings while an aging Public Request sat unread two cells left.
	//
	// It also cannot re-derive forever: once someone is reading a queue, a request resolving
	// elsewhere would swap the panel out from under them, and the band's one settle is meant to
	// fire per switch, not on its own.
	//
	// So it follows the data until every query behind the band reports ready, then commits and
	// stops. That is the sync's own signal rather than a guess at how long sync takes, so a slow
	// connection widens the window instead of missing it. A click or an arrow key commits it
	// sooner, because `pickedSignal` wins from the moment it is set.
	const signalsSettled =
		missionsReady && requestsReady && noticesReady && meetingsReady;
	const derivedRef = useRef(derivedSignal);
	derivedRef.current = derivedSignal;
	useEffect(() => {
		if (signalsSettled) {
			setPickedSignal((current) => current ?? derivedRef.current);
		}
	}, [signalsSettled]);

	const queues: Record<
		string,
		{ action: React.ReactNode; items: QueueItem[] }
	> = {
		aging: {
			action: <ViewAll label="All requests" to="/public-requests" />,
			items: agingRequests.map((r) => ({
				badge: (
					<Badge variant={REQUEST_STATUS_VARIANTS[r.status]}>
						{REQUEST_STATUS_LABELS[r.status]}
					</Badge>
				),
				id: r.id,
				linkProps: {
					params: { requestId: r.id },
					to: "/public-requests/$requestId",
				},
				meta: `${daysOpen(r.created_at, now)} days`,
				primary: r.name,
				secondary: `${requestTypeLabel(r.request_type)} · ${r.address_line_1 ?? r.email ?? "no address given"}`,
			})),
		},
		meetings: {
			action: <ViewAll label="All meetings" to="/meetings" />,
			items: upcomingMeetings.slice(0, 8).map((m) => ({
				id: m.id,
				linkProps: { params: { meetingId: m.id }, to: "/meetings/$meetingId" },
				meta: formatDateShort(m.meeting_at),
				primary: m.name,
				// The date already sits in `meta`; repeating the full `formatDateTime` string here
				// printed it twice on one row. The time is what the location line was missing.
				secondary: `${formatMeetingTime(m.meeting_at)} · ${m.location}`,
			})),
		},
		missions: {
			action: <ViewAll label="All Spray Missions" to="/spray-schedule" />,
			items: missionQueue.map((m) => ({
				badge: (
					<Badge variant={statusBadgeVariant(m.status)}>
						{m.status.charAt(0).toUpperCase() + m.status.slice(1)}
					</Badge>
				),
				id: m.id,
				linkProps: {
					params: { sprayScheduleId: m.id },
					to: "/spray-schedule/$sprayScheduleId",
				},
				meta: isSameDay(m.missionDate, now)
					? formatTimeRange(m.startTime, m.endTime)
					: formatDateShort(m.missionDate),
				primary: m.areaDescription,
				secondary: `${m.insecticideName} · ${formatTimeRange(m.startTime, m.endTime)}`,
			})),
		},
		"new-requests": {
			action: <ViewAll label="All requests" to="/public-requests" />,
			items: newRequests.slice(0, 8).map((r) => ({
				badge: (
					<Badge variant={REQUEST_STATUS_VARIANTS[r.status]}>
						{REQUEST_STATUS_LABELS[r.status]}
					</Badge>
				),
				id: r.id,
				linkProps: {
					params: { requestId: r.id },
					to: "/public-requests/$requestId",
				},
				meta: formatDateShort(r.created_at),
				primary: r.name,
				secondary: `${requestTypeLabel(r.request_type)} · ${r.address_line_1 ?? r.email ?? "no address given"}`,
			})),
		},
		notices: {
			action: <ViewAll label="All notices" to="/notices" />,
			items: unpublishedNotices.slice(0, 8).map((n) => ({
				badge: (
					<PublicNoticeBadge
						isArchived={n.is_archived}
						isPublished={n.is_published}
						noticeDate={n.notice_date}
					/>
				),
				id: n.id,
				linkProps: { params: { noticeId: n.id }, to: "/notices/$noticeId" },
				meta: formatDateShort(n.notice_date),
				primary: n.title,
			})),
		},
	};

	const emptyCopy: Record<string, { description: string; title: string }> = {
		aging: {
			description: `Nothing has been waiting ${AGING_DAYS} days or more.`,
			title: "Nothing is aging",
		},
		meetings: {
			description: "No meeting is on the calendar after today.",
			title: "No upcoming meetings",
		},
		missions: {
			description: "Nothing is scheduled tonight and nothing is delayed.",
			title: "No Spray Mission needs you",
		},
		"new-requests": {
			description: "Every request that came in has been picked up.",
			title: "Nothing awaiting triage",
		},
		notices: {
			description: "Every Notice is either published or archived.",
			title: "Nothing unpublished",
		},
	};

	const emptyIcons: Record<string, typeof SprayCan> = {
		aging: CheckCircle2,
		meetings: CalendarCheck,
		missions: SprayCan,
		"new-requests": Inbox,
		notices: FileText,
	};

	const open = queues[openSignal] ?? queues.missions;
	const copy = emptyCopy[openSignal] ?? emptyCopy.missions;

	return (
		<div>
			<PageHeader
				description="What needs you, and what the public sees right now."
				title="Dashboard"
			/>

			<SignalBand
				onValueChange={setPickedSignal}
				panelActions={open?.action}
				signals={signals}
				value={openSignal}
			>
				<SignalQueue
					emptyDescription={copy?.description ?? ""}
					emptyIcon={emptyIcons[openSignal] ?? SprayCan}
					emptyTitle={copy?.title ?? ""}
					items={open?.items ?? []}
				/>
			</SignalBand>

			{/*
			 * The confirming half. Deliberately quiet and non-interactive apart from its links: this
			 * is the answer to "is the site right?", read after the work, not the work itself.
			 */}
			<section aria-labelledby="public-register" className="mt-10">
				<h2
					className="mb-3 font-medium text-muted-foreground text-sm"
					id="public-register"
				>
					What the public sees right now
				</h2>
				<div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
					<RegisterFact
						detail={
							newestNotice
								? `newest ${formatDateShort(newestNotice.notice_date)}`
								: "the board is empty"
						}
						label="Notices on the board"
						to="/notices"
						value={`${publishedNotices.length}`}
					/>
					<RegisterFact
						detail="budgets, audits and minutes"
						label="Documents published"
						to="/documents"
						value={`${publishedDocuments.length}`}
					/>
					<RegisterFact
						detail="with labels and SDS"
						label="Insecticides listed"
						to="/insecticides"
						value={`${insecticides.length}`}
					/>
					<RegisterFact
						detail={
							openJobPostings.length ? "accepting applicants" : "none accepting"
						}
						label="Job Postings open"
						to="/job-postings"
						value={`${openJobPostings.length}`}
					/>
				</div>
			</section>
		</div>
	);
}

function ViewAll({ label, to }: { label: string; to: LinkProps["to"] }) {
	return (
		<Button asChild size="sm" variant="outline">
			<Link to={to}>{label}</Link>
		</Button>
	);
}

function RegisterFact({
	detail,
	label,
	to,
	value,
}: {
	detail: string;
	label: string;
	to: LinkProps["to"];
	value: string;
}) {
	return (
		<Link
			className="bg-muted px-4 py-3 transition-colors hover:bg-secondary focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
			to={to}
		>
			<span className="block text-muted-foreground text-xs">{label}</span>
			<span className="mt-0.5 block font-medium text-base tabular-nums leading-tight">
				{value}
			</span>
			<span className="block truncate text-muted-foreground text-xs leading-tight">
				{detail}
			</span>
		</Link>
	);
}
