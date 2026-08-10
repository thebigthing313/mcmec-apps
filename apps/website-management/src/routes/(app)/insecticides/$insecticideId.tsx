import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { InsecticidesRowType } from "@mcmec/supabase/db/insecticides";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mcmec/ui/components/alert-dialog";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { InsecticidesForm } from "@/src/components/insecticides-form";
import { insecticides } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";
import { rowVersion, useFormSeed } from "@/src/lib/use-form-seed";

export const Route = createFileRoute("/(app)/insecticides/$insecticideId")({
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

	// Seed from the live row, not the loader's one-shot read — see use-form-seed.ts.
	const { data: liveInsecticides } = useLiveQuery(
		(q) =>
			q
				.from({ insecticide: insecticides })
				.where(({ insecticide }) => eq(insecticide.id, insecticideId)),
		[insecticideId],
	);
	const insecticide = liveInsecticides[0] ?? loadedInsecticide;
	const { seedKey, latchProps } = useFormSeed(rowVersion(insecticide));

	const handleSubmit = async (value: InsecticidesRowType) => {
		const tx = insecticides.update(insecticideId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update insecticide.");
		navigate({ to: "/insecticides" });
	};

	const handleDelete = async () => {
		const tx = insecticides.delete(insecticideId);
		toastOnError(tx, "Failed to delete insecticide.");
		navigate({ to: "/insecticides" });
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

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Insecticide
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								insecticide "{insecticide.trade_name}".
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
