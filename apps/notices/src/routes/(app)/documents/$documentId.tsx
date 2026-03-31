import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { ArchiveX, ArrowLeft, Edit, ExternalLink, Upload } from "lucide-react";
import { documents, documentTypes } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/documents/$documentId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([documents.preload(), documentTypes.preload()]);
		const document = documents.get(params.documentId);
		if (!document) {
			throw notFound();
		}
		const typeName =
			documentTypes.get(document.document_type_id)?.name ?? "Document";
		return {
			crumb: `${document.fiscal_year} ${typeName}`,
			document,
		};
	},
});

function RouteComponent() {
	const { document } = Route.useLoaderData();
	const navigate = useNavigate();
	const { id, document_type_id, fiscal_year, url, is_published } = document;
	const type = documentTypes.get(document_type_id)?.name;

	const handlePublish = async () => {
		const tx = documents.update(id, (draft) => {
			draft.is_published = true;
		});
		toastOnError(tx, "Failed to publish document.");
		await tx.isPersisted.promise;
		navigate({ to: "/documents" });
	};

	const handleUnpublish = async () => {
		const tx = documents.update(id, (draft) => {
			draft.is_published = false;
		});
		toastOnError(tx, "Failed to unpublish document.");
		await tx.isPersisted.promise;
		navigate({ to: "/documents" });
	};

	const isDraft = !is_published;

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/documents">
						<ArrowLeft />
						Back to Documents
					</Link>
				</Button>
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link params={{ documentId: id }} to="/documents/$documentId/edit">
							<Edit />
							Edit
						</Link>
					</Button>
					{isDraft ? (
						<Button onClick={handlePublish} size="sm" variant="default">
							<Upload />
							Publish
						</Button>
					) : (
						<Button onClick={handleUnpublish} size="sm" variant="destructive">
							<ArchiveX />
							Unpublish
						</Button>
					)}
				</div>
			</nav>

			<article className="prose">
				<div className="flex flex-row items-baseline gap-2">
					<h2>
						{fiscal_year} {type}
					</h2>
					{is_published ? (
						<Badge variant="default">Published</Badge>
					) : (
						<Badge variant="outline">Draft</Badge>
					)}
				</div>
				<div>
					<a
						className="inline-flex items-center gap-1"
						href={url}
						rel="noopener noreferrer"
						target="_blank"
					>
						<ExternalLink className="h-4 w-4" />
						View Document
					</a>
				</div>
			</article>
		</div>
	);
}
