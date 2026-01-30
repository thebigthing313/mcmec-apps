import { formatDateTime } from "@mcmec/lib/functions/date-fns";
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
import { Label } from "../components/label";
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

	const years = React.useMemo(() => {
		const yearSet = new Set(
			data.map((meeting) => new Date(meeting.meetingAt).getFullYear()),
		);
		return Array.from(yearSet).sort((a, b) => b - a);
	}, [data]);

	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = React.useState<number>(currentYear);

	const sortedFilteredData = React.useMemo(() => {
		return data
			.filter(
				(meeting) => new Date(meeting.meetingAt).getFullYear() === selectedYear,
			)
			.sort((a, b) => a.meetingAt.getTime() - b.meetingAt.getTime());
	}, [data, selectedYear]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between px-4">
				<div className="flex items-center space-x-2">
					<Label>Year</Label>
					<Select
						onValueChange={(value) => setSelectedYear(Number(value))}
						value={`${selectedYear}`}
					>
						<SelectTrigger className="h-8 w-20">
							<SelectValue />
						</SelectTrigger>
						<SelectContent side="bottom">
							{years.map((year) => (
								<SelectItem key={year} value={`${year}`}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="font-medium text-sm">
					{sortedFilteredData.length} meeting
					{sortedFilteredData.length !== 1 ? "s" : ""}
				</div>
			</div>

			{sortedFilteredData.length === 0 ? (
				<div className="rounded-md border border-border p-8">
					<p className="text-center text-muted-foreground">
						No meetings found for {selectedYear}.
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
							{ label: "Agenda", url: meeting.agendaUrl },
							{ label: "Minutes", url: meeting.minutesUrl },
							{ label: "Report", url: meeting.reportUrl },
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
										<Badge variant={variant}>{status}</Badge>
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
