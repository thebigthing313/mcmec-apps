import {
	emptySprayPeriodLabel,
	NO_MISSIONS_MATCHING_FILTERS,
	partitionSprayMissions,
	type SprayPeriod,
	sprayPeriodCountLabel,
	sprayPeriodLabel,
} from "@mcmec/lib/functions/spray-periods";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SprayScheduleCard } from "@/src/components/spray-schedule-card";
import { SprayScheduleFilters } from "@/src/components/spray-schedule-filters";
import {
	municipalitiesQueryOptions,
	spraySchedulesQueryOptions,
} from "@/src/lib/queries";
import { canonical, seo } from "@/src/lib/seo";

export const Route = createFileRoute("/mosquito-control/spray-schedule")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Spray Schedule - MCMEC",
			description:
				"View upcoming mosquito spray missions scheduled by the Middlesex County Mosquito Extermination Commission.",
			url: "/mosquito-control/spray-schedule",
		}),
		links: [canonical("/mosquito-control/spray-schedule")],
	}),
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(spraySchedulesQueryOptions()),
			context.queryClient.ensureQueryData(municipalitiesQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const { data: schedules } = useSuspenseQuery(spraySchedulesQueryOptions());
	const { data: municipalitiesData } = useSuspenseQuery(
		municipalitiesQueryOptions(),
	);

	const [selectedMunicipality, setSelectedMunicipality] = useState("all");
	const [selectedStatus, setSelectedStatus] = useState("all");

	const municipalitiesList = municipalitiesData.map((m) => ({
		id: m.id,
		name: m.name,
	}));

	const filteredSchedules = useMemo(() => {
		return schedules.filter((s) => {
			if (
				selectedMunicipality !== "all" &&
				!s.municipalities.some((m) => m.id === selectedMunicipality)
			) {
				return false;
			}
			if (selectedStatus !== "all" && s.status !== selectedStatus) {
				return false;
			}
			return true;
		});
	}, [schedules, selectedMunicipality, selectedStatus]);

	// Upcoming first and soonest first, because "is my street being sprayed" is a
	// question about what is still to come. Grouping is by the clock only; the status
	// badge stays as staff authored it, so a past mission awaiting its "completed"
	// update still reads Scheduled — it just sits under Past where that is legible.
	const { upcoming, past } = useMemo(
		() =>
			partitionSprayMissions(filteredSchedules, (s) => ({
				endTime: s.end_time,
				missionDate: s.mission_date,
				startTime: s.start_time,
			})),
		[filteredSchedules],
	);

	const isFiltered = selectedMunicipality !== "all" || selectedStatus !== "all";

	return (
		<div className="flex flex-col gap-6">
			<article className="prose lg:prose-base max-w-none">
				<h1>Mosquito Spray Schedule</h1>
				<p>
					View upcoming and past mosquito spray missions conducted by the
					Middlesex County Mosquito Extermination Commission. Spray operations
					are weather-dependent and may be delayed or cancelled.
				</p>
			</article>

			<SprayScheduleFilters
				municipalities={municipalitiesList}
				onMunicipalityChange={setSelectedMunicipality}
				onStatusChange={setSelectedStatus}
				selectedMunicipality={selectedMunicipality}
				selectedStatus={selectedStatus}
			/>

			<SprayMissionGroup
				emptyLabel={
					// "No matches" only when the filters really did match nothing. With
					// past missions showing below, that line would be contradicted by the
					// cards under it; what is true then is that none of them is still to come.
					isFiltered && past.length === 0
						? NO_MISSIONS_MATCHING_FILTERS
						: emptySprayPeriodLabel("upcoming")
				}
				period="upcoming"
				schedules={upcoming}
			/>

			{past.length > 0 && <SprayMissionGroup period="past" schedules={past} />}
		</div>
	);
}

type SprayMission = Awaited<
	ReturnType<
		NonNullable<ReturnType<typeof spraySchedulesQueryOptions>["queryFn"]>
	>
>[number];

/**
 * One time-group of missions under its own heading.
 *
 * The heading is what makes the split legible: a stale "Scheduled" badge on a past
 * mission is only misleading while the mission sits at the top of one undivided list.
 * Under "Past spray missions" it reads as a record awaiting its update, which is what
 * it is.
 */
function SprayMissionGroup({
	emptyLabel,
	period,
	schedules,
}: {
	emptyLabel?: string;
	period: SprayPeriod;
	schedules: SprayMission[];
}) {
	const headingId = `spray-missions-${period}`;

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-4">
			<div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
				<h2 className="font-semibold text-foreground text-xl" id={headingId}>
					{sprayPeriodLabel(period)}
				</h2>
				<span className="text-muted-foreground text-sm tabular-nums">
					{sprayPeriodCountLabel(schedules.length, period)}
				</span>
			</div>

			{schedules.length > 0 ? (
				schedules.map((schedule) => (
					<SprayScheduleCard
						areaDescription={schedule.area_description}
						endTime={schedule.end_time}
						insecticideLabelUrl={schedule.insecticideLabelUrl}
						insecticideMsdsUrl={schedule.insecticideMsdsUrl}
						insecticideName={schedule.insecticideName}
						key={schedule.id}
						mapUrl={schedule.map_url}
						missionDate={schedule.mission_date}
						municipalities={schedule.municipalities
							.map((m) => m.name)
							.sort()
							.join(", ")}
						rainDate={schedule.rain_date}
						startTime={schedule.start_time}
						status={schedule.status}
					/>
				))
			) : (
				<p className="py-8 text-center text-muted-foreground">
					{emptyLabel ?? emptySprayPeriodLabel(period)}
				</p>
			)}
		</section>
	);
}
