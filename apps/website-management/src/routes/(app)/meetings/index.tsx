import { MeetingsMobileList } from "@mcmec/ui/blocks/meetings-mobile-list";
import {
	MeetingsTable,
	type MeetingTableRowType,
} from "@mcmec/ui/blocks/meetings-table";
import type { RowAction } from "@mcmec/ui/blocks/row-actions-menu";
import { Button } from "@mcmec/ui/components/button";
import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarOff, CalendarPlus, Plus } from "lucide-react";
import { meetings } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

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
		id: meeting.id,
		isCancelled: meeting.is_cancelled,
		meetingAt: meeting.meeting_at,
		minutesUrl: meeting.minutes_url,
		name: meeting.name,
		notes: meeting.notes,
		noticeUrl: meeting.notice_url,
	}));

	// A shortcut, never the only way in: cancelling is also on the detail view and in the edit
	// form (ADR 0001). Delete is not here and never can be — it lives in the danger zone on the
	// detail page. A cancel from a row carries no notes with it, so a meeting that has none is
	// refused here with the handler's own sentence, which is the same answer the detail view
	// gives.
	const rowActions = (meeting: MeetingTableRowType): RowAction[] => [
		meeting.isCancelled
			? {
					icon: <CalendarPlus />,
					label: "Reinstate Meeting",
					onAct: () =>
						runLifecycle(meetings, meeting.id, {
							apply: (draft) => {
								draft.is_cancelled = false;
							},
							command: "website.uncancelMeeting",
							failure: "Failed to reinstate meeting.",
						}),
				}
			: {
					icon: <CalendarOff />,
					label: "Cancel Meeting",
					onAct: () =>
						runLifecycle(meetings, meeting.id, {
							apply: (draft) => {
								draft.is_cancelled = true;
							},
							command: "website.cancelMeeting",
							failure: "Failed to cancel meeting.",
						}),
				},
	];

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
					rowActions={rowActions}
				/>
			) : (
				<MeetingsTable
					data={mappedData}
					linkToDetail={true}
					onRowClick={(meetingId) =>
						navigate({ params: { meetingId }, to: "/meetings/$meetingId" })
					}
					rowActions={rowActions}
				/>
			)}
		</div>
	);
}
