import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { intents } from "@/src/lib/intents";
import { staffEventWhen } from "./staff-event-details";
import { staffEventLifecycle } from "./staff-event-lifecycle";

const route = getRouteApi("/(app)/hr/staff-events/$staffEventId");

export function StaffEventPage() {
	const { staffEvents } = route.useRouteContext();
	const { staffEvent: loaded } = route.useLoaderData();
	const { staffEventId } = route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: live } = useLiveQuery(
		(q) =>
			q
				.from({ event: staffEvents })
				.where(({ event }) => eq(event.id, staffEventId)),
		[staffEvents, staffEventId],
	);
	const event = live[0] ?? loaded;
	const lifecycle = staffEventLifecycle(staffEvents, event);

	// Delete is for an event entered by mistake; one called off is cancelled instead, and stays
	// on the Calendar. Detail page only, danger zone, behind a confirm (ADR 0001).
	const handleDelete = () => {
		const tx = staffEvents.delete(
			event.id,
			intents("employees.deleteStaffEvent"),
		);
		toastOnError(tx, "Failed to delete the event.");
		navigate({ to: "/hr/staff-events" });
	};

	return (
		<RecordDetail
			actions={
				<>
					<Button asChild size="sm" variant="outline">
						<Link
							params={{ staffEventId: event.id }}
							to="/hr/staff-events/$staffEventId/edit"
						>
							<Edit />
							Edit
						</Link>
					</Button>
					<LifecycleButton
						icon={lifecycle.icon}
						label={lifecycle.label}
						onAct={() => lifecycle.onAct()}
						size="sm"
					/>
				</>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/hr/staff-events">
						<ArrowLeft />
						Back to Staff Events
					</Link>
				</Button>
			}
			badge={
				event.is_cancelled ? (
					<Badge variant="secondary">Cancelled</Badge>
				) : undefined
			}
			danger={
				<DangerZoneCard
					label="Delete Staff Event"
					onConfirm={handleDelete}
					recordName={event.title}
				/>
			}
			fields={[
				{ label: "When", value: staffEventWhen(event) },
				{ label: "Location", value: event.location ?? "—" },
			]}
			title={event.title}
		>
			{event.description ? (
				<p className="whitespace-pre-line text-foreground">
					{event.description}
				</p>
			) : null}
			{event.url ? (
				<a
					className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
					href={event.url}
					rel="noopener noreferrer"
					target="_blank"
				>
					<ExternalLink className="h-4 w-4" />
					{event.url}
				</a>
			) : null}
		</RecordDetail>
	);
}
