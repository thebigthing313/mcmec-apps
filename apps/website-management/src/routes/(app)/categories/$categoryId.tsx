import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, Edit } from "lucide-react";
import { intents, notices, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/categories/$categoryId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await noticeTypes.preload();
		const category = noticeTypes.get(params.categoryId);
		if (!category) {
			throw notFound();
		}
		return { category, crumb: category.name };
	},
});

function RouteComponent() {
	const { category: loadedCategory } = Route.useLoaderData();
	const { categoryId } = Route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveCategories } = useLiveQuery(
		(q) =>
			q
				.from({ notice_type: noticeTypes })
				.where(({ notice_type }) => eq(notice_type.id, categoryId)),
		[categoryId],
	);
	const category = liveCategories[0] ?? loadedCategory;

	// The count is the whole reason this page has a danger zone rather than a row button: it is
	// what decides whether Delete is offered at all, and the person about to click needs to see
	// it. The server refuses the raced case with a 409 naming the blocker.
	const { data: heldNotices } = useLiveQuery(
		(q) =>
			q
				.from({ notice: notices })
				.where(({ notice }) => eq(notice.notice_type_id, categoryId)),
		[categoryId],
	);
	const noticeCount = heldNotices.length;

	const handleDelete = () => {
		const tx = noticeTypes.delete(
			categoryId,
			intents("website.deleteNoticeCategory"),
		);
		toastOnError(tx, "Failed to delete category.");
		navigate({ to: "/categories" });
	};

	return (
		<RecordDetail
			actions={
				<Button asChild size="sm" variant="outline">
					<Link params={{ categoryId }} to="/categories/$categoryId/edit">
						<Edit />
						Edit
					</Link>
				</Button>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link to="/categories">
						<ArrowLeft />
						Back to Notice Categories
					</Link>
				</Button>
			}
			danger={
				<DangerZoneCard
					disabled={noticeCount > 0}
					label="Delete Category"
					onConfirm={handleDelete}
					recordName={category.name}
				/>
			}
			fields={[{ label: "Notices", value: noticeCount }]}
			subtitle={category.description ?? "No description."}
			title={category.name}
		>
			{/* The reason Delete is unavailable is stated here, in the page's own text, rather
			    than in a tooltip on the disabled button or in the dialog behind it. A disabled
			    button takes no focus, so anything hung off it is unreachable by keyboard and
			    invisible to a screen reader — which is how the previous screen explained this
			    rule, and it explained it to nobody. */}
			<p className="text-foreground">
				{noticeCount === 0
					? "No Notices are filed under this category, so it can be deleted."
					: `${noticeCount} ${noticeCount === 1 ? "Notice is" : "Notices are"} filed under this category, so it cannot be deleted. Move them to another category first.`}
			</p>
		</RecordDetail>
	);
}
