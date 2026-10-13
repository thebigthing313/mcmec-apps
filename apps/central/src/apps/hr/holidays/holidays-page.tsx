import {
	commissionToday,
	formatDateShortWithWeekday,
} from "@mcmec/lib/functions/date-fns";
import {
	RecordIndex,
	type RecordIndexColumn,
} from "@mcmec/ui/blocks/record-index";
import { YearStepper } from "@mcmec/ui/blocks/year-stepper";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { CalendarX2, Plus } from "lucide-react";

type HolidayRow = {
	id: string;
	name: string;
	observedOn: string;
	fallsOn: string | null;
};

const route = getRouteApi("/(app)/hr/holidays/");

/**
 * `/hr/holidays`: one year's Holidays, the way HR adopts them — a year at a time.
 *
 * The year comes from `?year=`, and an absent one is this year in Edison. It is read once per
 * render, not on a timer: a screen left open over New Year's Eve keeps last year until it is
 * next navigated.
 */
export function HolidaysPage() {
	const { holidays } = route.useRouteContext();
	const navigate = useNavigate();
	const search = route.useSearch();
	const year = search.year ?? Number(commissionToday().slice(0, 4));

	const { data, collection } = useLiveQuery(
		(q) => q.from({ holiday: holidays }),
		[holidays],
	);

	// `observed_on` is `YYYY-MM-DD` text, so its year is its first four characters — no Date, so
	// no zone to shift it. A Holiday belongs to the year it is observed in (CONTEXT.md).
	const rows: HolidayRow[] = (data ?? [])
		.filter((holiday) => holiday.observed_on.startsWith(`${year}-`))
		.map((holiday) => ({
			fallsOn: holiday.falls_on,
			id: holiday.id,
			name: holiday.name,
			observedOn: holiday.observed_on,
		}));

	const columns: RecordIndexColumn<HolidayRow>[] = [
		{
			cell: (row) => row.name,
			cellClassName: "max-w-[40ch] truncate",
			header: "Holiday",
			id: "name",
			identity: true,
			sortValue: (row) => row.name,
		},
		{
			cell: (row) => (
				<span className="tabular-nums">
					{formatDateShortWithWeekday(row.observedOn)}
				</span>
			),
			header: "Observed",
			id: "observedOn",
			// ISO text sorts as the calendar does.
			sortValue: (row) => row.observedOn,
		},
		{
			cell: (row) =>
				row.fallsOn ? (
					<span className="text-muted-foreground tabular-nums">
						{formatDateShortWithWeekday(row.fallsOn)}
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				),
			header: "Falls on",
			id: "fallsOn",
			sortValue: (row) => row.fallsOn,
		},
	];

	const setYear = (next: number) =>
		navigate({
			search: { ...search, page: 1, year: next },
			to: "/hr/holidays",
		});

	return (
		<RecordIndex
			actions={
				<Button onClick={() => navigate({ to: "/hr/holidays/create" })}>
					<Plus />
					Add Holiday
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "asc", id: "observedOn" }}
			description="The days the Commission closes its offices, a year at a time. Every Employee sees them on the Calendar."
			emptyState={{
				description:
					"Add a year's Holidays once the Commission adopts them. A day granted later in the year is added the same way.",
				icon: CalendarX2,
				title: `No Holidays entered for ${year}`,
			}}
			filters={<YearStepper onYearChange={setYear} year={year} />}
			getRowKey={(row) => row.id}
			getRowLabel={(row) =>
				`${row.name}, ${formatDateShortWithWeekday(row.observedOn)}`
			}
			getSearchText={(row) => row.name}
			onSearchChange={(next) =>
				navigate({ search: { ...search, ...next }, to: "/hr/holidays" })
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ holidayId: row.id }}
					to="/hr/holidays/$holidayId"
				>
					{children}
				</Link>
			)}
			rows={rows}
			search={search}
			searchPlaceholder="Search Holidays"
			state={collection.isReady() ? "ready" : "loading"}
			title="Holidays"
		/>
	);
}
