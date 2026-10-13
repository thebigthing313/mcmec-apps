import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import { intents } from "@/src/lib/intents";
import { changedFields } from "@/src/lib/lifecycle";
import { HolidayForm, type HolidayFormValues } from "./holiday-form";
import { saveHoliday } from "./save-holiday";

const route = getRouteApi("/(app)/hr/holidays/$holidayId_/edit");

export function EditHolidayPage() {
	const { holidays } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { holiday: loadedHoliday } = route.useLoaderData();
	const { holidayId } = route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveHolidays } = useLiveQuery(
		(q) =>
			q
				.from({ holiday: holidays })
				.where(({ holiday }) => eq(holiday.id, holidayId)),
		[holidays, holidayId],
	);
	const holiday = liveHolidays[0] ?? loadedHoliday;
	const { seedKey, latchProps } = useFormSeed(rowVersion(holiday));

	const handleSubmit = async (value: HolidayFormValues) => {
		const done = () =>
			navigate({ params: { holidayId }, to: "/hr/holidays/$holidayId" });
		// Only what changed: `updateHoliday` refuses an empty payload.
		const changes = changedFields(value, holiday);
		if (Object.keys(changes).length === 0) {
			done();
			return undefined;
		}
		const tx = holidays.update(
			holidayId,
			intents("employees.updateHoliday"),
			(draft) => {
				Object.assign(draft, changes);
			},
		);
		const result = await saveHoliday(tx, "Failed to update Holiday.");
		if (!result.saved) return result.errors;
		done();
		return undefined;
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<PageHeader title="Edit Holiday" />
			<HolidayForm
				defaultValues={{
					falls_on: holiday.falls_on,
					name: holiday.name,
					observed_on: holiday.observed_on,
				}}
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
