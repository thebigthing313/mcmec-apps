import { formatDate, formatDateShort } from "@mcmec/lib/functions/date-fns";
import { partitionSprayMissions } from "@mcmec/lib/functions/spray-periods";
import { Badge } from "@mcmec/ui/components/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	meetingsQueryOptions,
	noticesQueryOptions,
	spraySchedulesQueryOptions,
} from "../lib/queries";

/**
 * Three facts from the public record, on the page a resident actually lands on.
 *
 * The home page carried no date at all — not a notice date, not a meeting date, not a spray
 * mission. On a site whose stated product *is* the record, that leaves a visitor no way to
 * tell a maintained register from an abandoned one, and answers "is my street being treated"
 * with a link rather than an answer.
 *
 * **It does not say "tonight."** `spray-periods.ts` rejects that word by name and gives the
 * reason: missions run overnight, so a mission dated the 4th starting at 3am is, to the person
 * who sees the truck, the night of the 3rd. Any "tonight" claim is wrong for a large share of
 * missions and wrong in the direction that tells a resident they are clear when they are not.
 * "Next" carries no such claim. The strip inherits that rule rather than relitigating it.
 *
 * **Absence is an answer and reads as one.** "No spray missions are currently scheduled" is
 * information; a blank cell is a bug the visitor has to diagnose. Every cell states its empty
 * case in a full sentence.
 *
 * **Status is the authored word, never derived.** A past-dated mission still badged Scheduled
 * is correct — staff advance that lifecycle by hand (ADR 0001). Grouping here is by the clock;
 * the badge is the record.
 *
 * **A cancelled meeting still appears.** PRODUCT.md keeps cancelled meetings visible because
 * the public record must show they were called; hiding one to make the strip tidier would be
 * the exact deletion that principle forbids. It appears carrying the word "Cancelled."
 *
 * Queries are non-suspense on purpose. This is the front door, and it must render whether or
 * not the api answers — see the route's loader.
 */

function Cell({
	heading,
	to,
	children,
}: {
	heading: string;
	to: string;
	children: React.ReactNode;
}) {
	return (
		<Link
			className="group relative flex flex-col gap-1.5 bg-card p-5 transition-colors hover:bg-secondary focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring md:p-6"
			to={to}
		>
			{/*
			 * Uppercase as a column heading, which the Uppercase Is Structural Rule names as one
			 * of its four homes — the same treatment the footer's column headings take.
			 */}
			<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
				{heading}
			</span>
			{children}
		</Link>
	);
}

function Absent({ children }: { children: React.ReactNode }) {
	return <span className="text-muted-foreground text-sm">{children}</span>;
}

export function CurrentRecord() {
	const { data: schedules } = useQuery(spraySchedulesQueryOptions());
	const { data: notices } = useQuery(noticesQueryOptions());
	const { data: meetings } = useQuery(meetingsQueryOptions());

	const nextMission = schedules
		? partitionSprayMissions(schedules, (schedule) => ({
				endTime: schedule.end_time,
				missionDate: schedule.mission_date,
				startTime: schedule.start_time,
			})).upcoming[0]
		: undefined;

	const latestNotice = notices
		? [...notices]
				.filter((notice) => !notice.is_archived && notice.is_published)
				.sort(
					(a, b) =>
						new Date(b.notice_date).getTime() -
						new Date(a.notice_date).getTime(),
				)[0]
		: undefined;

	const nextMeeting = meetings
		? [...meetings]
				.filter((meeting) => meeting.meeting_at.getTime() >= Date.now())
				.sort((a, b) => a.meeting_at.getTime() - b.meeting_at.getTime())[0]
		: undefined;

	return (
		/*
		 * `--band-inset` is the hero's own gutter, and it sits on the section rather than on
		 * the grid: the grid's ground is the Rule colour that draws the dividers, so padding
		 * the grid would paint that colour into the gutter. Carried here, the strip's outer
		 * cell edges land on the same line the register panel's border takes in the half
		 * above, and the band reads as one composition instead of two left margins.
		 */
		<section
			aria-labelledby="current-record-heading"
			className="border-t px-[var(--band-inset)]"
		>
			<h2 className="sr-only" id="current-record-heading">
				What the Commission has published
			</h2>
			<div className="grid gap-px bg-border md:grid-cols-3">
				<Cell
					heading="Next spray mission"
					to="/mosquito-control/spray-schedule"
				>
					{nextMission ? (
						<>
							<span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-base text-foreground">
								{formatDateShort(nextMission.mission_date)}
								<Badge
									variant={
										nextMission.status === "scheduled" ? "default" : "outline"
									}
								>
									{nextMission.status.charAt(0).toUpperCase() +
										nextMission.status.slice(1)}
								</Badge>
							</span>
							<span className="text-muted-foreground text-sm">
								{nextMission.municipalities.length > 0
									? nextMission.municipalities.map((m) => m.name).join(", ")
									: nextMission.area_description}
								{" · "}
								{nextMission.start_time.slice(0, 5)}–
								{nextMission.end_time.slice(0, 5)}
							</span>
						</>
					) : (
						<Absent>No spray missions are currently scheduled.</Absent>
					)}
				</Cell>

				<Cell heading="Latest legal notice" to="/notices">
					{latestNotice ? (
						<>
							<span className="line-clamp-2 font-semibold text-base text-foreground">
								{latestNotice.title}
							</span>
							<span className="text-muted-foreground text-sm">
								Posted {formatDateShort(latestNotice.notice_date)}
							</span>
						</>
					) : (
						<Absent>No notices are currently posted.</Absent>
					)}
				</Cell>

				<Cell heading="Next public meeting" to="/notices/meetings">
					{nextMeeting ? (
						<>
							<span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-base text-foreground">
								{formatDate(nextMeeting.meeting_at)}
								{nextMeeting.is_cancelled ? (
									<Badge variant="outline">Cancelled</Badge>
								) : null}
							</span>
							<span className="text-muted-foreground text-sm">
								{nextMeeting.name}
								{nextMeeting.location ? ` · ${nextMeeting.location}` : ""}
							</span>
						</>
					) : (
						<Absent>No meetings are currently scheduled.</Absent>
					)}
				</Cell>
			</div>
		</section>
	);
}
