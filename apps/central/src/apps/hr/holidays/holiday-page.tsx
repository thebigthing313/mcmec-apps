import { formatDateWithWeekday } from "@mcmec/lib/functions/date-fns";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit } from "lucide-react";
import { intents } from "@/src/lib/intents";

const route = getRouteApi("/(app)/hr/holidays/$holidayId");

export function HolidayPage() {
	const { holidays } = route.useRouteContext();
	const { holiday: loadedHoliday } = route.useLoaderData();
	const { holidayId } = route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveHolidays } = useLiveQuery(
		(q) =>
			q
				.from({ holiday: holidays })
				.where(({ holiday }) => eq(holiday.id, holidayId)),
		[holidays, holidayId],
	);
	const holiday = liveHolidays[0] ?? loadedHoliday;
	// Back to the year this Holiday belongs to, which is the year it is observed in.
	const year = Number(holiday.observed_on.slice(0, 4));

	// A revoked Holiday is deleted: there is no lifecycle to move it through instead. Detail page
	// only, in the danger zone, behind a confirm (ADR 0001).
	const handleDelete = () => {
		const tx = holidays.delete(holiday.id, intents("employees.deleteHoliday"));
		toastOnError(tx, "Failed to delete Holiday.");
		navigate({ search: { year }, to: "/hr/holidays" });
	};

	return (
		<RecordDetail
			actions={
				<Button asChild size="sm" variant="outline">
					<Link params={{ holidayId }} to="/hr/holidays/$holidayId/edit">
						<Edit />
						Edit
					</Link>
				</Button>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={{ year }} to="/hr/holidays">
						<ArrowLeft />
						Back to Holidays
					</Link>
				</Button>
			}
			danger={
				<DangerZoneCard
					label="Delete Holiday"
					onConfirm={handleDelete}
					recordName={holiday.name}
				/>
			}
			fields={[
				{
					label: "Observed (offices closed)",
					value: formatDateWithWeekday(holiday.observed_on),
				},
				{
					label: "Falls on",
					value: holiday.falls_on
						? formatDateWithWeekday(holiday.falls_on)
						: "The day it is observed",
				},
			]}
			title={holiday.name}
		/>
	);
}
