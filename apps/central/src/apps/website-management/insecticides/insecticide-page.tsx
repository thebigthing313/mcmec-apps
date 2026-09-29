import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/insecticides/$insecticideId",
);

export function InsecticidePage() {
	const { insecticides } = route.useRouteContext();
	const { insecticide: loadedInsecticide } = route.useLoaderData();
	const { insecticideId } = route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveInsecticides } = useLiveQuery(
		(q) =>
			q
				.from({ insecticide: insecticides })
				.where(({ insecticide }) => eq(insecticide.id, insecticideId)),
		[insecticides, insecticideId],
	);
	const insecticide = liveInsecticides[0] ?? loadedInsecticide;
	const {
		id,
		trade_name,
		type_name,
		active_ingredient,
		active_ingredient_url,
		label_url,
		msds_url,
	} = insecticide;

	const links = [
		{ label: "Label", url: label_url },
		{ label: "SDS", url: msds_url },
	].filter((link) => link.url);

	// No LifecycleButton: insecticides have no lifecycle columns. This page exists to hold the
	// danger zone and for nothing else, which is exactly what ADR 0001 decided — `delete*` is
	// the one command whose placement is not free, so a table with no lifecycle at all still
	// needs a detail page to put it on.
	//
	// A spray mission still naming this product refuses with a 409 that says which one — the
	// dialog asks without knowing, because only the server does.
	const handleDelete = () => {
		const tx = insecticides.delete(id, intents("website.deleteInsecticide"));
		toastOnError(tx, "Failed to delete insecticide.");
		navigate({ to: "/website-management/insecticides" });
	};

	return (
		<RecordDetail
			actions={
				<Button asChild size="sm" variant="outline">
					<Link
						params={{ insecticideId: id }}
						to="/website-management/insecticides/$insecticideId/edit"
					>
						<Edit />
						Edit
					</Link>
				</Button>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/website-management/insecticides">
						<ArrowLeft />
						Back to Insecticides
					</Link>
				</Button>
			}
			danger={
				<DangerZoneCard
					label="Delete Insecticide"
					onConfirm={handleDelete}
					recordName={trade_name}
				/>
			}
			fields={[
				{
					label: "Active ingredient",
					value: (
						<a
							className="inline-flex items-center gap-1 text-primary hover:underline"
							href={active_ingredient_url}
							rel="noopener noreferrer"
							target="_blank"
						>
							<ExternalLink className="h-4 w-4" />
							{active_ingredient}
						</a>
					),
				},
			]}
			subtitle={type_name}
			title={trade_name}
		>
			{links.length > 0 ? (
				<div className="flex flex-wrap gap-4">
					{links.map((link) => (
						<a
							className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
							href={link.url}
							key={link.label}
							rel="noopener noreferrer"
							target="_blank"
						>
							<ExternalLink className="h-4 w-4" />
							{link.label}
						</a>
					))}
				</div>
			) : null}
		</RecordDetail>
	);
}
