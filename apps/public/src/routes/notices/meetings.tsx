import { keepUpcomingAndRecentYears } from "@mcmec/lib/functions/recent-years";
import { MeetingsMobileList } from "@mcmec/ui/blocks/meetings-mobile-list";
import {
	MeetingsTable,
	type MeetingTableRowType,
} from "@mcmec/ui/blocks/meetings-table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { meetingsQueryOptions } from "../../lib/queries";
import { canonical, seo } from "../../lib/seo";

export const Route = createFileRoute("/notices/meetings")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Public Meetings - MCMEC",
			description:
				"Meeting schedules, agendas, and minutes for the Middlesex County Mosquito Extermination Commission.",
			url: "/notices/meetings",
		}),
		links: [canonical("/notices/meetings")],
	}),
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(meetingsQueryOptions());
	},
});

function RouteComponent() {
	const { data: meetings } = useSuspenseQuery(meetingsQueryOptions());

	// Windowed on the meeting's own date, never on whether its minutes are posted — a
	// meeting still to be minuted is on the page for its notice.
	const visibleMeetings = keepUpcomingAndRecentYears(
		meetings,
		(meeting) => meeting.meeting_at,
	);

	const mappedData: MeetingTableRowType[] = visibleMeetings.map((meeting) => ({
		id: meeting.id,
		isCancelled: meeting.is_cancelled,
		meetingAt: meeting.meeting_at,
		minutesUrl: meeting.minutes_url,
		name: meeting.name,
		notes: meeting.notes,
		noticeUrl: meeting.notice_url,
	}));

	return (
		<div className="flex flex-col gap-4">
			<article className="prose lg:prose-base mb-8 max-w-none">
				<h1>Meetings</h1>
				<p>
					In accordance with the New Jersey Open Public Meetings Act (N.J.S.A.
					10:4-6 et seq.), the Middlesex County Mosquito Extermination
					Commission (MCMEC) is committed to ensuring transparency and public
					access to the governmental decision-making process. This page serves
					as the official repository for public meeting notices, agendas, and
					minutes. Meetings are open to the public to witness the deliberation
					and policy formulation of this body. Please note that while meetings
					are held in public, participation is governed by MCMEC's public
					comment protocols. In compliance with P.L. 2025, c.72, all legal
					notices for upcoming meetings will be posted here at least 48 hours in
					advance and will remain archived for a minimum of one year.
				</p>
			</article>

			{/*
			 * Chosen by CSS, not by a hook. `useIsMobile` returns false on the server and
			 * during the first client render, then flips after an effect — so on a phone the
			 * server sent the table and the browser swapped in the list, which is a hydration
			 * mismatch and a visible jump on the page carrying the OPMA notice. The navbar
			 * already picks its two layouts this way; both render, one is shown.
			 */}
			<div className="md:hidden">
				<MeetingsMobileList data={mappedData} linkToDetail={false} />
			</div>
			<div className="hidden md:block">
				<MeetingsTable data={mappedData} linkToDetail={false} />
			</div>
		</div>
	);
}
