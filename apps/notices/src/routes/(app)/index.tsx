import {
	formatDateShort,
	formatDateTime,
	getTodayUTC,
} from "@mcmec/lib/functions/date-fns";
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
	Bug,
	CheckCircle,
	Clock,
	Mail,
	MailOpen,
	Users,
} from "lucide-react";

export const Route = createFileRoute("/(app)/")({
	component: RouteComponent,
	loader: () => {
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

	// Service requests data
	const { data: pendingAdultMosquito } = useLiveQuery((q) =>
		q
			.from({ r: db.adultMosquitoRequests })
			.where(({ r }) => eq(r.is_processed, false))
			.orderBy(({ r }) => r.created_at, "desc"),
	);

	const { data: pendingMosquitofish } = useLiveQuery((q) =>
		q
			.from({ r: db.mosquitofishRequests })
			.where(({ r }) => eq(r.is_processed, false))
			.orderBy(({ r }) => r.created_at, "desc"),
	);

	const { data: pendingWaterMgmt } = useLiveQuery((q) =>
		q
			.from({ r: db.waterManagementRequests })
			.where(({ r }) => eq(r.is_processed, false))
			.orderBy(({ r }) => r.created_at, "desc"),
	);

	// Contact submissions data
	const { data: openSubmissions } = useLiveQuery((q) =>
		q
			.from({ s: db.contactFormSubmissions })
			.where(({ s }) => eq(s.is_closed, false))
			.orderBy(({ s }) => s.created_at, "desc")
			.limit(5),
	);

	const { data: closedSubmissions } = useLiveQuery((q) =>
		q
			.from({ s: db.contactFormSubmissions })
			.where(({ s }) => eq(s.is_closed, true)),
	);

	// Meetings data
	const { data: upcomingMeetings } = useLiveQuery((q) =>
		q
			.from({ m: db.meetings })
			.where(({ m }) => eq(m.is_cancelled, false))
			.orderBy(({ m }) => m.meeting_at, "desc")
			.limit(5),
	);

	const totalPendingRequests =
		pendingAdultMosquito.length +
		pendingMosquitofish.length +
		pendingWaterMgmt.length;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl">Dashboard</h1>
				<p className="text-muted-foreground">
					Overview of notices, requests, and submissions
				</p>
			</div>

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
						<CardTitle className="font-medium text-sm">
							Pending Requests
						</CardTitle>
						<Bug className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{totalPendingRequests}</div>
						<p className="text-muted-foreground text-xs">
							{pendingAdultMosquito.length} mosquito,{" "}
							{pendingMosquitofish.length} fish, {pendingWaterMgmt.length} water
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Open Submissions
						</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{openSubmissions.length}</div>
						<p className="text-muted-foreground text-xs">
							{closedSubmissions.length} closed
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
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Pending Service Requests */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Pending Service Requests</CardTitle>
								<CardDescription>Requests awaiting processing</CardDescription>
							</div>
							<Button asChild size="sm" variant="outline">
								<Link to="/service-requests">View All</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{totalPendingRequests > 0 ? (
							<ul className="space-y-3">
								{pendingAdultMosquito.slice(0, 3).map((r) => (
									<li key={r.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ requestId: r.id }}
											to="/service-requests/adult-mosquito/$requestId"
										>
											<div className="flex-1">
												<p className="font-medium">{r.full_name}</p>
												<p className="text-muted-foreground text-sm">
													{r.address_line_1}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="outline">Mosquito</Badge>
												<span className="text-muted-foreground text-xs">
													{formatDateShort(r.created_at)}
												</span>
											</div>
										</Link>
									</li>
								))}
								{pendingMosquitofish.slice(0, 3).map((r) => (
									<li key={r.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ requestId: r.id }}
											to="/service-requests/mosquitofish/$requestId"
										>
											<div className="flex-1">
												<p className="font-medium">{r.full_name}</p>
												<p className="text-muted-foreground text-sm">
													{r.address_line_1}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="outline">Fish</Badge>
												<span className="text-muted-foreground text-xs">
													{formatDateShort(r.created_at)}
												</span>
											</div>
										</Link>
									</li>
								))}
								{pendingWaterMgmt.slice(0, 3).map((r) => (
									<li key={r.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ requestId: r.id }}
											to="/service-requests/water-management/$requestId"
										>
											<div className="flex-1">
												<p className="font-medium">{r.full_name}</p>
												<p className="text-muted-foreground text-sm">
													{r.address_line_1}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="outline">Water</Badge>
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
									All requests have been processed
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Open Contact Submissions */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Open Contact Submissions</CardTitle>
								<CardDescription>Messages awaiting response</CardDescription>
							</div>
							<Button asChild size="sm" variant="outline">
								<Link to="/contact-submissions">View All</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{openSubmissions.length > 0 ? (
							<ul className="space-y-3">
								{openSubmissions.map((s) => (
									<li key={s.id}>
										<Link
											className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											params={{ submissionId: s.id }}
											to="/contact-submissions/$submissionId"
										>
											<div className="flex-1">
												<p className="font-medium">{s.subject}</p>
												<p className="text-muted-foreground text-sm">
													{s.name} &mdash; {s.email}
												</p>
											</div>
											<span className="text-muted-foreground text-xs">
												{formatDateShort(s.created_at)}
											</span>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<MailOpen className="mb-2 h-8 w-8 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									No open submissions
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
			</div>
		</div>
	);
}
