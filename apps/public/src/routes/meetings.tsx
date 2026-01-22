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
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Meetings</h1>
			{isMobile ? (
				<MeetingsMobileList data={mappedData} linkToDetail={false} />
			) : (
				<MeetingsTable data={mappedData} linkToDetail={false} />
			)}
		</div>
	);
}
