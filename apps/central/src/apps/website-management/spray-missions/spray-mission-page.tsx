import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { MissionTransitionButton } from "@/src/apps/website-management/components/mission-transition-button";
import { runLifecycle } from "@/src/apps/website-management/lib/lifecycle";
import { transitionsFrom } from "@/src/apps/website-management/lib/spray-mission-transitions";
import {
	formatTimeRange,
	statusBadgeVariant,
	statusLabel,
} from "@/src/apps/website-management/lib/spray-schedule";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/spray-missions/$sprayScheduleId",
);

export function SprayMissionPage() {
	const {
		insecticides,
		municipalities,
		sprayScheduleMunicipalities,
		spraySchedules,
	} = route.useRouteContext();
	const { schedule: loadedSchedule } = route.useLoaderData();
	const { sprayScheduleId } = route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveSchedules } = useLiveQuery(
		(q) =>
			q
				.from({ schedule: spraySchedules })
				.where(({ schedule }) => eq(schedule.id, sprayScheduleId)),
		[spraySchedules, sprayScheduleId],
	);
	const schedule = liveSchedules[0] ?? loadedSchedule;

	const { data: links } = useLiveQuery(
		(q) =>
			q
				.from({ link: sprayScheduleMunicipalities })
				.where(({ link }) => eq(link.spray_schedule_id, sprayScheduleId)),
		[sprayScheduleMunicipalities, sprayScheduleId],
	);
	// Subscriptions rather than one-shot `get()`s: the loader preloads both tables, and a
	// preloaded collection nobody subscribes to syncs for the rest of the session
	// (src/lib/collections/registry.ts).
	const { data: municipalityRows } = useLiveQuery(
		(q) => q.from({ municipality: municipalities }),
		[municipalities],
	);
	const linkedIds = new Set(links.map((link) => link.municipality_id));
	const municipalityNames = municipalityRows
		.filter((municipality) => linkedIds.has(municipality.id))
		.map((municipality) => municipality.name)
		.sort();

	const { data: liveInsecticides } = useLiveQuery(
		(q) =>
			q
				.from({ insecticide: insecticides })
				.where(({ insecticide }) =>
					eq(insecticide.id, schedule.insecticide_id),
				),
		[insecticides, schedule.insecticide_id],
	);
	const insecticideName = liveInsecticides[0]?.trade_name ?? "";

	// One button per legal transition, never a dropdown of states. The page stays put afterwards
	// — the badge below is live, so the result of the click is visible where the click was.
	//
	// Each button carries its own guard: Cancel and Mark Complete ask first, because a mission is
	// on the public spray schedule and residents plan an evening around it, and Delay asks for
	// the rain date `CONTEXT.md` says a delayed mission carries. `MissionTransitionButton` owns
	// which is which, so no screen can guard the same command differently.
	const transitions = transitionsFrom(schedule.status);

	// The mission's own name, for the dialogs. The index leads with the area and this page leads
	// with the date, so the dialogs name both rather than picking a side.
	const missionName = `${schedule.area_description} on ${formatDateShort(schedule.mission_date)}`;

	// A rain date collected while delaying is a Save-and-Delay — `updateSprayMissionDetails` then
	// `delaySprayMission`, one request, one transaction, exactly as the domain module prescribes.
	// It only counts as a save when it actually changed, or an unchanged date earns a 400 from
	// `updateSprayMissionDetails`'s own non-empty refinement.
	const runTransition = (
		transition: (typeof transitions)[number],
		extra?: { rainDate: string | null },
	) => {
		const storedRainDate = schedule.rain_date
			? new Date(schedule.rain_date).toISOString().slice(0, 10)
			: null;
		const rainDateChanged =
			extra !== undefined && (extra.rainDate ?? null) !== storedRainDate;
		runLifecycle(spraySchedules, sprayScheduleId, {
			apply: (draft) => {
				draft.status = transition.to;
			},
			command: transition.command,
			failure: transition.failure,
			save: rainDateChanged
				? {
						changes: { rain_date: extra?.rainDate ?? null },
						command: "website.updateSprayMissionDetails",
					}
				: undefined,
			success: `${missionName} now shows as ${statusLabel(transition.to)} on the public spray schedule.`,
		});
	};

	// Delete is the one action whose placement is not free — detail page only, danger zone,
	// behind a confirm (ADR 0001). It leaves the page because the record it was showing is gone.
	const handleDelete = () => {
		const tx = spraySchedules.delete(
			sprayScheduleId,
			intents("website.deleteSprayMission"),
		);
		toastOnError(tx, "Failed to delete spray mission.");
		navigate({ to: "/website-management/spray-missions" });
	};

	return (
		<RecordDetail
			actions={
				<>
					<Button asChild size="sm" variant="outline">
						<Link
							params={{ sprayScheduleId }}
							to="/website-management/spray-missions/$sprayScheduleId/edit"
						>
							<Edit />
							Edit
						</Link>
					</Button>
					{transitions.map((transition) => (
						<MissionTransitionButton
							key={transition.command}
							missionName={missionName}
							onAct={(extra) => runTransition(transition, extra)}
							rainDate={schedule.rain_date}
							size="sm"
							transition={transition}
						/>
					))}
				</>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/website-management/spray-missions">
						<ArrowLeft />
						Back to Spray Missions
					</Link>
				</Button>
			}
			badge={
				<Badge variant={statusBadgeVariant(schedule.status)}>
					{statusLabel(schedule.status)}
				</Badge>
			}
			danger={
				<DangerZoneCard
					description={`This permanently deletes ${missionName} and the municipalities linked to it. This cannot be undone.`}
					label="Delete Spray Mission"
					onConfirm={handleDelete}
					recordName={missionName}
				/>
			}
			fields={[
				{
					label: "Window",
					value: formatTimeRange(schedule.start_time, schedule.end_time),
				},
				{
					label: "Rain date",
					value: schedule.rain_date
						? formatDateShort(schedule.rain_date)
						: "None set",
				},
				{ label: "Insecticide", value: insecticideName },
				{
					label: "Municipalities",
					value:
						municipalityNames.length > 0
							? municipalityNames.join(", ")
							: "None selected",
				},
			]}
			// The index leads with the area and this page led with the date, so a search for a
			// truncated area string landed on a page titled "Aug 14". The area is what a mission is
			// to the people running it; the date is its subtitle.
			subtitle={formatDateShort(schedule.mission_date)}
			title={schedule.area_description}
		>
			{schedule.map_url ? (
				<a
					className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
					href={schedule.map_url}
					rel="noopener noreferrer"
					target="_blank"
				>
					<ExternalLink className="h-4 w-4" />
					Spray area map
				</a>
			) : null}
		</RecordDetail>
	);
}
