import { formatDateTime } from "@mcmec/lib/functions/date-fns";
import {
	emptyMeetingPeriodLabel,
	meetingPeriodCountLabel,
	meetingPeriodLabel,
} from "@mcmec/lib/functions/meeting-periods";
import { Badge } from "@mcmec/ui/components/badge";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from "@mcmec/ui/components/item";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import * as React from "react";
import {
	meetingPeriodValue,
	parseMeetingPeriodValue,
	useMeetingPeriod,
} from "../hooks/use-meeting-period";
import type { MeetingTableRowType } from "./meetings-table";
import { type RowAction, RowActionsMenu } from "./row-actions-menu";

interface MeetingsMobileListProps {
	data: MeetingTableRowType[];
	linkToDetail?: boolean;
	onRowClick?: (meetingId: string) => void;
	/** The mobile half of `MeetingsTable`'s row shortcuts (ADR 0001). Public passes none. */
	rowActions?: (meeting: MeetingTableRowType) => RowAction[];
}

export function MeetingsMobileList({
	data,
	linkToDetail = false,
	onRowClick,
	rowActions,
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

	const labelId = React.useId();
	const { meetings, period, periods, setPeriod } = useMeetingPeriod(data);

	const sortedFilteredData = React.useMemo(
		() =>
			[...meetings].sort(
				(a, b) => a.meetingAt.getTime() - b.meetingAt.getTime(),
			),
		[meetings],
	);

	return (
		<div className="space-y-4">
			{periods.length > 0 ? (
				<div className="flex items-center justify-between px-4">
					<div className="flex items-center space-x-2">
						<p className="text-muted-foreground text-sm" id={labelId}>
							Show
						</p>
						<Select
							onValueChange={(value) =>
								setPeriod(parseMeetingPeriodValue(value))
							}
							value={meetingPeriodValue(period)}
						>
							<SelectTrigger aria-labelledby={labelId} className="h-8 w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent side="bottom">
								{periods.map((option) => (
									<SelectItem key={option} value={meetingPeriodValue(option)}>
										{meetingPeriodLabel(option)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="font-medium text-sm">
						{meetingPeriodCountLabel(sortedFilteredData.length, period)}
					</div>
				</div>
			) : null}

			{sortedFilteredData.length === 0 ? (
				<div className="rounded-md border border-border p-8">
					<p className="text-center text-muted-foreground">
						{emptyMeetingPeriodLabel(period)}
					</p>
				</div>
			) : (
				<ItemGroup>
					{sortedFilteredData.map((meeting) => {
						const { status, variant } = getMeetingStatus(
							meeting.isCancelled,
							meeting.meetingAt,
						);
						const links = [
							{ label: "Minutes", url: meeting.minutesUrl },
							{ label: "48-Hour Notice", url: meeting.noticeUrl },
						].filter((link) => link.url);

						return (
							<React.Fragment key={meeting.id}>
								<Item className="rounded-none" size="default" variant="outline">
									<ItemHeader>
										<ItemTitle>
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
										</ItemTitle>
										<div className="flex items-center gap-1">
											<Badge variant={variant}>{status}</Badge>
											{rowActions ? (
												<RowActionsMenu actions={rowActions(meeting)} />
											) : null}
										</div>
									</ItemHeader>

									<ItemContent>
										<ItemDescription>
											{formatDateTime(meeting.meetingAt)}
										</ItemDescription>
									</ItemContent>

									{(links.length > 0 || meeting.notes) && (
										<ItemFooter>
											<div className="flex w-full flex-col gap-2">
												{links.length > 0 && (
													<div className="flex flex-wrap gap-2">
														{links.map((link) => (
															<a
																className="text-primary text-xs hover:underline"
																href={link.url as string}
																key={link.label}
																rel="noopener noreferrer"
																target="_blank"
															>
																{link.label}
															</a>
														))}
													</div>
												)}
												{meeting.notes && (
													<p className="text-muted-foreground text-xs">
														{meeting.notes}
													</p>
												)}
											</div>
										</ItemFooter>
									)}
								</Item>
							</React.Fragment>
						);
					})}
				</ItemGroup>
			)}
		</div>
	);
}
