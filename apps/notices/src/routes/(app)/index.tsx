import { PublicNoticeCard } from "@mcmec/ui/blocks/public-notice-card";
import { Button } from "@mcmec/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@mcmec/ui/components/empty";
import { eq, lte, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNotices } from "@/src/hooks/use-notices";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";

export const Route = createFileRoute("/(app)/")({
	component: RouteComponent,
	loader: async () => {
		await Promise.all([notices.preload(), notice_types.preload()]);
		return { crumb: "Dashboard" };
	},
});

function RouteComponent() {
	const { collection: allNotices } = useNotices();
	const [currentPage, setCurrentPage] = useState(1);
	const noticesPerPage = 5;

	const { data: currentNotices } = useLiveQuery((q) =>
		q
			.from({ notice: allNotices })
			.where(({ notice }) => eq(notice.isPublished, true))
			.where(({ notice }) => eq(notice.isArchived, false))
			.where(({ notice }) => lte(notice.noticeDate, new Date()))
			.orderBy(({ notice }) => notice.noticeDate, "desc"),
	);

	// Get draft notices
	const { data: draftNotices } = useLiveQuery((q) =>
		q
			.from({ notice: allNotices })
			.where(({ notice }) => eq(notice.isPublished, false))
			.orderBy(({ notice }) => notice.noticeDate, "desc")
			.limit(10),
	);

	// Get archived notices
	const { data: archivedNotices } = useLiveQuery((q) =>
		q
			.from({ notice: allNotices })
			.where(({ notice }) => eq(notice.isArchived, true))
			.orderBy(({ notice }) => notice.noticeDate, "desc")
			.limit(10),
	);

	// Pagination calculations
	const totalNotices = currentNotices?.length ?? 0;
	const totalPages = Math.ceil(totalNotices / noticesPerPage);
	const startIndex = (currentPage - 1) * noticesPerPage;
	const endIndex = startIndex + noticesPerPage;
	const paginatedNotices = currentNotices?.slice(startIndex, endIndex);

	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(1, prev - 1));
	};

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(totalPages, prev + 1));
	};

	return (
		<div className="container mx-auto space-y-6 py-6">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Dashboard</h1>
				<p className="text-muted-foreground">Overview of your public notices</p>
			</div>

			<div className="flex flex-row flex-wrap gap-6">
				{/* Left Column: Current Notices */}
				<div
					className="flex flex-1 flex-col space-y-4"
					style={{ minWidth: "400px" }}
				>
					<h2 className="font-semibold text-2xl">Current Notices</h2>
					{paginatedNotices && paginatedNotices.length > 0 ? (
						<>
							<div className="space-y-4">
								{paginatedNotices.map((notice) => {
									return (
										<Link
											key={notice.id}
											params={{ noticeId: notice.id }}
											to="/notices/$noticeId"
										>
											<PublicNoticeCard
												className="transition-shadow hover:shadow-lg"
												content={notice.content}
												isArchived={notice.isArchived}
												isPublished={notice.isPublished}
												noticeDate={notice.noticeDate}
												title={notice.title}
												type={notice.noticeType}
											/>
										</Link>
									);
								})}
							</div>
							{totalPages > 1 && (
								<div className="flex items-center justify-between">
									<p className="text-muted-foreground text-sm">
										Page {currentPage} of {totalPages}
									</p>
									<div className="flex gap-2">
										<Button
											disabled={currentPage === 1}
											onClick={handlePreviousPage}
											size="sm"
											variant="outline"
										>
											<ChevronLeft className="h-4 w-4" />
											Previous
										</Button>
										<Button
											disabled={currentPage === totalPages}
											onClick={handleNextPage}
											size="sm"
											variant="outline"
										>
											Next
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No current notices</EmptyTitle>
								<EmptyDescription>
									There are no published notices at the moment
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</div>

				{/* Right Column: Drafts and Archive */}
				<div
					className="flex flex-col space-y-6"
					style={{ minWidth: "400px", width: "400px" }}
				>
					{/* Open Drafts Widget */}
					<Card>
						<CardHeader>
							<CardTitle>Open Drafts</CardTitle>
							<CardDescription>
								Notices that haven't been published
							</CardDescription>
						</CardHeader>
						<CardContent>
							{draftNotices && draftNotices.length > 0 ? (
								<ul className="space-y-2">
									{draftNotices.map((notice) => {
										return (
											<li key={notice.id}>
												<Link
													className="flex items-start justify-between rounded-md p-2 transition-colors hover:bg-muted"
													params={{ noticeId: notice.id }}
													to="/notices/$noticeId"
												>
													<div className="flex-1">
														<p className="font-medium">{notice.title}</p>
														<p className="text-muted-foreground text-sm">
															{notice.noticeType}
														</p>
													</div>
													<span className="text-muted-foreground text-xs">
														{notice.noticeDate.toLocaleDateString()}
													</span>
												</Link>
											</li>
										);
									})}
								</ul>
							) : (
								<Empty>
									<EmptyHeader>
										<EmptyTitle>No drafts</EmptyTitle>
										<EmptyDescription>
											All notices have been published
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}
						</CardContent>
					</Card>

					{/* Archived Notices Widget */}
					<Card>
						<CardHeader>
							<CardTitle>Archived Notices</CardTitle>
							<CardDescription>Recently archived notices</CardDescription>
						</CardHeader>
						<CardContent>
							{archivedNotices && archivedNotices.length > 0 ? (
								<ul className="space-y-2">
									{archivedNotices.map((notice) => {
										return (
											<li key={notice.id}>
												<Link
													className="flex items-start justify-between rounded-md p-2 transition-colors hover:bg-muted"
													params={{ noticeId: notice.id }}
													to="/notices/$noticeId"
												>
													<div className="flex-1">
														<p className="font-medium">{notice.title}</p>
														<p className="text-muted-foreground text-sm">
															{notice.noticeType}
														</p>
													</div>
													<span className="text-muted-foreground text-xs">
														{notice.noticeDate.toLocaleDateString()}
													</span>
												</Link>
											</li>
										);
									})}
								</ul>
							) : (
								<Empty>
									<EmptyHeader>
										<EmptyTitle>No archived notices</EmptyTitle>
										<EmptyDescription>
											Archived notices will appear here
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
