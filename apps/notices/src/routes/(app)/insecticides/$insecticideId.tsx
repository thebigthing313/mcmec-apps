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
import { createFileRoute } from "@tanstack/react-router";
import { InsecticidesForm } from "@/src/components/insecticides-form";
import { insecticides } from "@/src/lib/collections/insecticides";

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
	const { insecticide } = Route.useLoaderData();
	const { insecticideId } = Route.useParams();

	const handleSubmit = async (value: InsecticidesRowType) => {
		insecticides.update(insecticideId, (draft) => {
			Object.assign(draft, value);
		});
		navigate({ to: "/insecticides" });
	};

	const handleDelete = async () => {
		insecticides.delete(insecticideId);
		navigate({ to: "/insecticides" });
	};

	const defaultValues: InsecticidesRowType = { ...insecticide };

	return (
		<div className="space-y-4">
			<InsecticidesForm
				defaultValues={defaultValues}
				formLabel="Edit Insecticide"
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
