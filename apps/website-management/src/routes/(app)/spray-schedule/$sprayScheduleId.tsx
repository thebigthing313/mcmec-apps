import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import {
	formatTimeRange,
	statusBadgeVariant,
} from "@/src/components/spray-schedule-table";
import {
	insecticides,
	intents,
	municipalities,
	sprayScheduleMunicipalities,
	spraySchedules,
} from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";
import { transitionsFrom } from "@/src/lib/spray-mission-transitions";

export const Route = createFileRoute("/(app)/spray-schedule/$sprayScheduleId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await spraySchedules.preload();
		const schedule = spraySchedules.get(params.sprayScheduleId);
		if (!schedule) {
			throw notFound();
		}
		return { crumb: formatDateShort(schedule.mission_date), schedule };
	},
});

function RouteComponent() {
	const { schedule: loadedSchedule } = Route.useLoaderData();
	const { sprayScheduleId } = Route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveSchedules } = useLiveQuery(
		(q) =>
			q
				.from({ schedule: spraySchedules })
				.where(({ schedule }) => eq(schedule.id, sprayScheduleId)),
		[sprayScheduleId],
	);
	const schedule = liveSchedules[0] ?? loadedSchedule;

	const { data: links } = useLiveQuery(
		(q) =>
			q
				.from({ link: sprayScheduleMunicipalities })
				.where(({ link }) => eq(link.spray_schedule_id, sprayScheduleId)),
		[sprayScheduleId],
	);
	const municipalityNames = links
		.map((link) => municipalities.get(link.municipality_id)?.name)
		.filter((name): name is string => !!name)
		.sort();

	const insecticideName =
		insecticides.get(schedule.insecticide_id)?.trade_name ?? "";

	// One button per legal transition, never a dropdown of states. No form under this, so no
	// `isDirty` and no relabel: a detail-view lifecycle button always sends exactly one intent.
	// The page stays put afterwards — the badge below is live, so the result of the click is
	// visible where the click was.
	const transitions = transitionsFrom(schedule.status);

	// Delete is the one action whose placement is not free — detail page only, danger zone,
	// behind a confirm (ADR 0001). It leaves the page because the record it was showing is gone.
	const handleDelete = () => {
		const tx = spraySchedules.delete(
			sprayScheduleId,
			intents("website.deleteSprayMission"),
		);
		toastOnError(tx, "Failed to delete spray mission.");
		navigate({ to: "/spray-schedule" });
	};

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/spray-schedule">
						<ArrowLeft />
						Back to Spray Missions
					</Link>
				</Button>
				<div className="flex flex-wrap items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link
							params={{ sprayScheduleId }}
							to="/spray-schedule/$sprayScheduleId/edit"
						>
							<Edit />
							Edit
						</Link>
					</Button>
					{transitions.map((transition) => (
						<LifecycleButton
							icon={transition.icon}
							key={transition.command}
							label={transition.label}
							onAct={() =>
								runLifecycle(spraySchedules, sprayScheduleId, {
									apply: (draft) => {
										draft.status = transition.to;
									},
									command: transition.command,
									failure: transition.failure,
								})
							}
							size="sm"
						/>
					))}
				</div>
			</nav>

			<article className="prose">
				<div className="flex flex-row items-baseline gap-2">
					<h2>{formatDateShort(schedule.mission_date)}</h2>
					<Badge variant={statusBadgeVariant(schedule.status)}>
						{schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
					</Badge>
				</div>
				<h4>{formatTimeRange(schedule.start_time, schedule.end_time)}</h4>
				{schedule.rain_date ? (
					<p>Rain date: {formatDateShort(schedule.rain_date)}</p>
				) : null}
				<p>{schedule.area_description}</p>
				<dl>
					<dt>Insecticide</dt>
					<dd>{insecticideName}</dd>
					<dt>Municipalities</dt>
					<dd>
						{municipalityNames.length > 0
							? municipalityNames.join(", ")
							: "None selected"}
					</dd>
				</dl>
				{schedule.map_url ? (
					<a
						className="inline-flex items-center gap-1"
						href={schedule.map_url}
						rel="noopener noreferrer"
						target="_blank"
					>
						<ExternalLink className="h-4 w-4" />
						Spray area map
					</a>
				) : null}
			</article>

			<DangerZoneCard
				description="This action cannot be undone. This will permanently delete this spray mission and the municipalities linked to it."
				label="Delete Spray Mission"
				onConfirm={handleDelete}
			/>
		</div>
	);
}
