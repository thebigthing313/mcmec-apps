import { MeetingsMobileList } from "@mcmec/ui/blocks/meetings-mobile-list";
import {
	MeetingsTable,
	type MeetingTableRowType,
} from "@mcmec/ui/blocks/meetings-table";
import { Button } from "@mcmec/ui/components/button";
import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { meetings } from "@/src/lib/collections/meetings";

export const Route = createFileRoute("/(app)/meetings/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Meetings Index" };
	},
});

function RouteComponent() {
	const navigate = useNavigate();
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
		<div className="flex flex-col gap-2">
			<Button
				onClick={() => navigate({ to: "/meetings/create" })}
				variant="default"
			>
				<Plus />
				Create New Meeting
			</Button>
			{isMobile ? (
				<MeetingsMobileList
					data={mappedData}
					linkToDetail={true}
					onRowClick={(meetingId) =>
						navigate({ params: { meetingId }, to: "/meetings/$meetingId" })
					}
				/>
			) : (
				<MeetingsTable
					data={mappedData}
					linkToDetail={true}
					onRowClick={(meetingId) =>
						navigate({ params: { meetingId }, to: "/meetings/$meetingId" })
					}
				/>
			)}
		</div>
	);
}
