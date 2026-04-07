import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import {
	documentsQueryOptions,
	documentTypesQueryOptions,
} from "../../lib/queries";
import { canonical, seo } from "../../lib/seo";

export const Route = createFileRoute("/notices/transparency")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Transparency - MCMEC",
			description:
				"Transparency documents and public information from the Middlesex County Mosquito Extermination Commission.",
			url: "/notices/transparency",
		}),
		links: [canonical("/notices/transparency")],
	}),
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(documentsQueryOptions()),
			context.queryClient.ensureQueryData(documentTypesQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const { data: documents } = useSuspenseQuery(documentsQueryOptions());
	const { data: documentTypes } = useSuspenseQuery(documentTypesQueryOptions());

	const documentTypesMap = new Map(
		documentTypes.map((type) => [type.id, type.name]),
	);

	// Filter to published only and group by type
	const publishedDocs = documents.filter((doc) => doc.is_published);

	const grouped = new Map<string, typeof publishedDocs>();
	for (const doc of publishedDocs) {
		const typeName =
			documentTypesMap.get(doc.document_type_id) || "Uncategorized";
		if (!grouped.has(typeName)) {
			grouped.set(typeName, []);
		}
		grouped.get(typeName)?.push(doc);
	}

	// Sort each group by fiscal year descending
	for (const docs of grouped.values()) {
		docs.sort((a, b) => b.fiscal_year - a.fiscal_year);
	}

	// Sort group names alphabetically
	const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) =>
		a.localeCompare(b),
	);

	return (
		<div className="mx-auto max-w-4xl">
			<article className="prose lg:prose-base mb-8 max-w-none">
				<h1>Transparency</h1>
				<p>
					In compliance with N.J.S.A. 40A:5A-17.1 and L. 2011, c.167, the
					Middlesex County Mosquito Extermination Commission publishes the
					following documents for public access, including budgets, financial
					reports, audits, and consultant disclosures.
				</p>
			</article>

			{sortedGroups.length === 0 ? (
				<p className="text-muted-foreground">
					No documents are currently published.
				</p>
			) : (
				<div className="flex flex-col gap-8">
					{sortedGroups.map(([typeName, docs]) => (
						<section key={typeName}>
							<h2 className="mb-4 border-b pb-2 font-semibold text-2xl">
								{typeName}
							</h2>
							<ul className="flex flex-col gap-3">
								{docs.map((doc) => (
									<li
										className="flex items-center justify-between rounded-lg border p-4"
										key={doc.id}
									>
										<span className="font-medium">
											Fiscal Year {doc.fiscal_year}
										</span>
										<a
											className="inline-flex shrink-0 items-center gap-1 text-primary text-sm hover:underline"
											href={doc.url}
											rel="noopener noreferrer"
											target="_blank"
										>
											<ExternalLink className="h-4 w-4" />
											View
										</a>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
