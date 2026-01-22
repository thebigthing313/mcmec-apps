import { formatDateTime } from "@mcmec/lib/functions/date-fns";
import { Badge } from "@mcmec/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import { Separator } from "@mcmec/ui/components/separator";
import type { MeetingTableRowType } from "./meetings-table";

interface MeetingsMobileListProps {
	data: MeetingTableRowType[];
	linkToDetail?: boolean;
	onRowClick?: (meetingId: string) => void;
}

export function MeetingsMobileList({
	data,
	linkToDetail = false,
	onRowClick,
}: MeetingsMobileListProps) {
	const getMeetingStatus = (
		isCancelled: boolean,
		meetingAt: Date,
	): { status: string; variant: "default" | "secondary" | "outline" } => {
		const now = new Date();
		const hasPassed = meetingAt < now;

		if (isCancelled) {
			return { status: "Cancelled", variant: "secondary" };
		}
		if (hasPassed) {
			return { status: "Past", variant: "outline" };
		}
		return { status: "Pending", variant: "default" };
	};

	if (data.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-center text-muted-foreground">
						No meetings found.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{data.map((meeting) => {
				const { status, variant } = getMeetingStatus(
					meeting.isCancelled,
					meeting.meetingAt,
				);
				const links = [
					{ label: "Agenda", url: meeting.agendaUrl },
					{ label: "Minutes", url: meeting.minutesUrl },
					{ label: "Report", url: meeting.reportUrl },
					{ label: "48-Hour Notice", url: meeting.noticeUrl },
				].filter((link) => link.url);

				return (
					<Card key={meeting.id}>
						<CardHeader>
							<div className="flex items-start justify-between gap-2">
								<CardTitle className="text-lg">
									{linkToDetail && onRowClick ? (
										<button
										className="text-left text-primary hover:underline"
											onClick={() => onRowClick(meeting.id)}
											type="button"
										>
											{meeting.name}
										</button>
									) : (
										meeting.name
									)}
								</CardTitle>
								<Badge variant={variant}>{status}</Badge>
							</div>
							<CardDescription>
								{formatDateTime(meeting.meetingAt)}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{links.length > 0 && (
								<>
									<div>
										<p className="mb-2 text-sm font-medium">Links</p>
										<div className="flex flex-wrap gap-2">
											{links.map((link) => (
												<a
													className="text-primary text-sm hover:underline"
													href={link.url as string}
													key={link.label}
													rel="noopener noreferrer"
													target="_blank"
												>
													{link.label}
												</a>
											))}
										</div>
									</div>
									{meeting.notes && <Separator />}
								</>
							)}
							{meeting.notes && (
								<div>
									<p className="mb-1 text-sm font-medium">Notes</p>
									<p className="text-sm text-muted-foreground">
										{meeting.notes}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
