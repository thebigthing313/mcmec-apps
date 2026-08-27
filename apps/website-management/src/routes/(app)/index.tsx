import {
	formatDateShort,
	formatDateTime,
	getTodayUTC,
} from "@mcmec/lib/functions/date-fns";
import { PageHeader } from "@mcmec/ui/blocks/page-header";

import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import { eq, gt, lte, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BookOpen,
	Calendar,
	CheckCircle,
	Clock,
	Inbox,
	SprayCan,
	Users,
} from "lucide-react";
import { requestTypeLabel } from "@/src/lib/public-requests";

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
		]);
		return { crumb: "Dashboard" };
	},
});

function RouteComponent() {
	const { db } = Route.useRouteContext();
	const now = getTodayUTC();

	// Notices data
	const { data: publishedNotices } = useLiveQuery((q) =>
		q
			.from({ n: db.notices })
			.where(({ n }) => eq(n.is_published, true))
			.where(({ n }) => eq(n.is_archived, false))
			.where(({ n }) => lte(n.notice_date, now))
			.orderBy(({ n }) => n.notice_date, "desc")
			.limit(5),
	);

	const { data: pendingNotices } = useLiveQuery((q) =>
		q
			.from({ n: db.notices })
			.where(({ n }) => eq(n.is_published, true))
			.where(({ n }) => eq(n.is_archived, false))
			.where(({ n }) => gt(n.notice_date, now))
			.orderBy(({ n }) => n.notice_date, "asc"),
	);

	const { data: draftNotices } = useLiveQuery((q) =>
		q
			.from({ n: db.notices })
			.where(({ n }) => eq(n.is_published, false))
			.orderBy(({ n }) => n.notice_date, "desc")
			.limit(5),
	);

	// Public intake — one merged collection, split by status/type here.
	const { data: allRequests } = useLiveQuery((q) =>
		q.from({ r: db.publicRequests }).orderBy(({ r }) => r.created_at, "desc"),
	);

	const openRequests = allRequests.filter((r) => r.status !== "resolved");
	const resolvedRequestCount = allRequests.length - openRequests.length;

	// Meetings data
	const { data: upcomingMeetings } = useLiveQuery((q) =>
		q
			.from({ m: db.meetings })
			.where(({ m }) => eq(m.is_cancelled, false))
			.orderBy(({ m }) => m.meeting_at, "desc")
			.limit(5),
	);

	// Spray schedule data
	const { data: scheduledMissions } = useLiveQuery((q) =>
		q
			.from({ s: db.spraySchedules })
			.where(({ s }) => eq(s.status, "scheduled"))
			.orderBy(({ s }) => s.mission_date, "asc"),
	);

	const { data: delayedMissions } = useLiveQuery((q) =>
		q.from({ s: db.spraySchedules }).where(({ s }) => eq(s.status, "delayed")),
	);

	const { data: completedMissions } = useLiveQuery((q) =>
		q
			.from({ s: db.spraySchedules })
			.where(({ s }) => eq(s.status, "completed")),
	);

	const { data: recentMissions } = useLiveQuery((q) =>
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
			.orderBy(({ s }) => s.mission_date, "desc")
			.limit(5),
	);

	const newRequestCount = allRequests.filter((r) => r.status === "new").length;

	return (
		<div className="space-y-6">
			<PageHeader
				description="Overview of notices, requests, and submissions."
				title="Dashboard"
			/>

			{/* Stats Row */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Published Notices
						</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{publishedNotices.length}</div>
						<p className="text-muted-foreground text-xs">
							{pendingNotices.length} pending, {draftNotices.length} draft
							{draftNotices.length !== 1 && "s"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Open Requests</CardTitle>
						<Inbox className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{openRequests.length}</div>
						<p className="text-muted-foreground text-xs">
							{newRequestCount} new, {resolvedRequestCount} resolved
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Upcoming Meetings
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{upcomingMeetings.length}</div>
						<p className="text-muted-foreground text-xs">scheduled</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Spray Missions
						</CardTitle>
						<SprayCan className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{scheduledMissions.length}</div>
						<p className="text-muted-foreground text-xs">
							{delayedMissions.length} delayed, {completedMissions.length}{" "}
							completed
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Open Public Requests */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Open Public Requests</CardTitle>
								<CardDescription>
									Service requests and inquiries awaiting triage
								</CardDescription>
							</div>
							<Button asChild size="sm" variant="outline">
								<Link to="/public-requests">View All</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{openRequests.length > 0 ? (
							<ul className="space-y-3">
								{openRequests.slice(0, 6).map((r) => (
									<li key={r.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ requestId: r.id }}
											to="/public-requests/$requestId"
										>
											<div className="flex-1">
												<p className="font-medium">{r.name}</p>
												<p className="text-muted-foreground text-sm">
													{r.address_line_1 ?? r.email ?? "—"}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="outline">
													{requestTypeLabel(r.request_type)}
												</Badge>
												<span className="text-muted-foreground text-xs">
													{formatDateShort(r.created_at)}
												</span>
											</div>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									Every request has been resolved
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recent Notices */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Recent Notices</CardTitle>
								<CardDescription>Latest published notices</CardDescription>
							</div>
							<Button asChild size="sm" variant="outline">
								<Link to="/notices">View All</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{publishedNotices.length > 0 ? (
							<ul className="space-y-3">
								{publishedNotices.map((n) => (
									<li key={n.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ noticeId: n.id }}
											to="/notices/$noticeId"
										>
											<div className="flex-1">
												<p className="font-medium">{n.title}</p>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="default">Published</Badge>
												<span className="text-muted-foreground text-xs">
													{formatDateShort(n.notice_date)}
												</span>
											</div>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									No published notices
								</p>
							</div>
						)}

						{pendingNotices.length > 0 && (
							<div className="mt-4 border-t pt-4">
								<p className="mb-2 font-medium text-muted-foreground text-sm">
									Pending (future date)
								</p>
								<ul className="space-y-2">
									{pendingNotices.map((n) => (
										<li key={n.id}>
											<Link
												className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
												params={{ noticeId: n.id }}
												to="/notices/$noticeId"
											>
												<p className="font-medium text-sm">{n.title}</p>
												<div className="flex items-center gap-2">
													<Badge variant="secondary">Pending</Badge>
													<span className="text-muted-foreground text-xs">
														{formatDateShort(n.notice_date)}
													</span>
												</div>
											</Link>
										</li>
									))}
								</ul>
							</div>
						)}

						{draftNotices.length > 0 && (
							<div className="mt-4 border-t pt-4">
								<p className="mb-2 font-medium text-muted-foreground text-sm">
									Drafts
								</p>
								<ul className="space-y-2">
									{draftNotices.map((n) => (
										<li key={n.id}>
											<Link
												className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
												params={{ noticeId: n.id }}
												to="/notices/$noticeId"
											>
												<p className="font-medium text-sm">{n.title}</p>
												<Badge variant="outline">Draft</Badge>
											</Link>
										</li>
									))}
								</ul>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Upcoming Meetings */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Meetings</CardTitle>
								<CardDescription>Recent and upcoming meetings</CardDescription>
							</div>
							<Button asChild size="sm" variant="outline">
								<Link to="/meetings">View All</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{upcomingMeetings.length > 0 ? (
							<ul className="space-y-3">
								{upcomingMeetings.map((m) => (
									<li key={m.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ meetingId: m.id }}
											to="/meetings/$meetingId"
										>
											<div className="flex-1">
												<p className="font-medium">{m.name}</p>
												<div className="flex items-center gap-1 text-muted-foreground text-sm">
													<Clock className="h-3 w-3" />
													{formatDateTime(m.meeting_at)}
												</div>
											</div>
											<p className="text-muted-foreground text-xs">
												{m.location}
											</p>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<Users className="mb-2 h-8 w-8 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									No upcoming meetings
								</p>
							</div>
						)}
					</CardContent>
				</Card>
				{/* Spray Missions */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Spray Missions</CardTitle>
								<CardDescription>Recent and upcoming missions</CardDescription>
							</div>
							<Button asChild size="sm" variant="outline">
								<Link to="/spray-schedule">View All</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{recentMissions.length > 0 ? (
							<ul className="space-y-3">
								{recentMissions.map((m) => (
									<li key={m.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ sprayScheduleId: m.id }}
											to="/spray-schedule/$sprayScheduleId"
										>
											<div className="flex-1">
												<p className="line-clamp-1 font-medium">
													{m.areaDescription}
												</p>
												<div className="flex items-center gap-1 text-muted-foreground text-sm">
													<Calendar className="h-3 w-3" />
													{formatDateShort(m.missionDate)}
												</div>
											</div>
											<Badge
												variant={
													m.status === "scheduled"
														? "default"
														: m.status === "delayed"
															? "outline"
															: m.status === "cancelled"
																? "destructive"
																: "secondary"
												}
											>
												{m.status.charAt(0).toUpperCase() + m.status.slice(1)}
											</Badge>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<SprayCan className="mb-2 h-8 w-8 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									No spray missions
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
