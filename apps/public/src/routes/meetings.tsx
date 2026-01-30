import { MeetingsMobileList } from "@mcmec/ui/blocks/meetings-mobile-list";
import {
	MeetingsTable,
	type MeetingTableRowType,
} from "@mcmec/ui/blocks/meetings-table";
import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { meetings } from "../lib/collections/meetings";

export const Route = createFileRoute("/meetings")({
	component: RouteComponent,
	loader: async () => {
		await meetings.preload();
	},
});

function RouteComponent() {
	const isMobile = useIsMobile();
	const { data } = useLiveQuery((q) => q.from({ meeting: meetings }));

	const mappedData: MeetingTableRowType[] = data.map((meeting) => ({
		agendaUrl: meeting.agenda_url,
		id: meeting.id,
		isCancelled: meeting.is_cancelled,
		meetingAt: meeting.meeting_at,
		minutesUrl: meeting.minutes_url,
		name: meeting.name,
		notes: meeting.notes,
		noticeUrl: meeting.notice_url,
		reportUrl: meeting.report_url,
	}));

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl mb-8 max-w-none">
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

			{isMobile ? (
				<MeetingsMobileList data={mappedData} linkToDetail={false} />
			) : (
				<MeetingsTable data={mappedData} linkToDetail={false} />
			)}
		</div>
	);
}
