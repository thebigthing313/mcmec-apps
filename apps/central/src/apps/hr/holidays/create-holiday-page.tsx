import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { getRouteApi } from "@tanstack/react-router";
import { intents } from "@/src/lib/intents";
import { HolidayForm, type HolidayFormValues } from "./holiday-form";
import { saveHoliday } from "./save-holiday";

const route = getRouteApi("/(app)/hr/holidays/create");

export function CreateHolidayPage() {
	const { holidays } = route.useRouteContext();
	const navigate = route.useNavigate();

	const handleSubmit = async (value: HolidayFormValues) => {
		const now = new Date();
		// The id minted here is the id the row will have: the envelope carries it and the handler
		// honours it, so the optimistic row and the committed row share a key.
		const id = crypto.randomUUID();
		const tx = holidays.insert(
			{ ...value, created_at: now, id, updated_at: now },
			intents("employees.createHoliday"),
		);
		const result = await saveHoliday(tx, "Failed to add Holiday.");
		if (!result.saved) return result.errors;
		navigate({ params: { holidayId: id }, to: "/hr/holidays/$holidayId" });
		return undefined;
	};

	return (
		<div>
			<PageHeader title="Add Holiday" />
			<HolidayForm
				defaultValues={{ falls_on: null, name: "", observed_on: "" }}
				onSubmit={handleSubmit}
				submitLabel="Add Holiday"
			/>
		</div>
	);
}
