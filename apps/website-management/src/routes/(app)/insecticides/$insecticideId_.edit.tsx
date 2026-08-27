import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { InsecticidesRowType } from "@mcmec/schemas/db/insecticides";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { InsecticidesForm } from "@/src/components/insecticides-form";
import { insecticides, intents } from "@/src/lib/db";

export const Route = createFileRoute(
	"/(app)/insecticides/$insecticideId_/edit",
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		await insecticides.preload();
		const insecticide = insecticides.get(params.insecticideId);
		if (!insecticide) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", insecticide };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { insecticide: loadedInsecticide } = Route.useLoaderData();
	const { insecticideId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveInsecticides } = useLiveQuery(
		(q) =>
			q
				.from({ insecticide: insecticides })
				.where(({ insecticide }) => eq(insecticide.id, insecticideId)),
		[insecticideId],
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
		navigate({ params: { insecticideId }, to: "/insecticides/$insecticideId" });
	};

	const defaultValues: InsecticidesRowType = { ...insecticide };

	return (
		<div className="space-y-4" {...latchProps}>
			<InsecticidesForm
				defaultValues={defaultValues}
				formLabel="Edit Insecticide"
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
