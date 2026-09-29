import type { InsecticidesRowType } from "@mcmec/schemas/db/insecticides";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import { InsecticidesForm } from "@/src/apps/website-management/components/insecticides-form";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/insecticides/$insecticideId_/edit",
);

export function EditInsecticidePage() {
	const { insecticides } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { insecticide: loadedInsecticide } = route.useLoaderData();
	const { insecticideId } = route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveInsecticides } = useLiveQuery(
		(q) =>
			q
				.from({ insecticide: insecticides })
				.where(({ insecticide }) => eq(insecticide.id, insecticideId)),
		[insecticides, insecticideId],
	);
	const insecticide = liveInsecticides[0] ?? loadedInsecticide;
	const { seedKey, latchProps } = useFormSeed(rowVersion(insecticide));

	// No `actions` render prop and no Save-and-X: the table has no lifecycle columns, so
	// `website.updateInsecticideDetails` is the only command this form can send.
	const handleSubmit = async (value: InsecticidesRowType) => {
		const tx = insecticides.update(
			insecticideId,
			intents("website.updateInsecticideDetails"),
			(draft) => {
				Object.assign(draft, value);
			},
		);
		toastOnError(tx, "Failed to update insecticide.");
		navigate({
			params: { insecticideId },
			to: "/website-management/insecticides/$insecticideId",
		});
	};

	const defaultValues: InsecticidesRowType = { ...insecticide };

	return (
		<div className="space-y-4" {...latchProps}>
			<PageHeader title="Edit Insecticide" />
			<InsecticidesForm
				defaultValues={defaultValues}
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
