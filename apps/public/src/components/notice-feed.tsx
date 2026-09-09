import { PublicNoticeCard } from "@mcmec/ui/blocks/public-notice-card";
import { Button } from "@mcmec/ui/components/button";
import { Input } from "@mcmec/ui/components/input";
import { Label } from "@mcmec/ui/components/label";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@mcmec/ui/components/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

/** The unfiltered value for the Type and Year selects. */
const ALL = "all";

/**
 * Every string a Tiptap document actually says.
 *
 * Search used to match titles only, so a resident looking for their own street — which is
 * named in the body of a spray notice and nowhere in its heading — got nothing back and had
 * to read the register. The renderer walks the same shape; this walks it for text.
 */
function contentText(content: unknown): string {
	if (typeof content === "string") {
		return content;
	}
	if (Array.isArray(content)) {
		return content.map(contentText).join(" ");
	}
	if (content && typeof content === "object") {
		const node = content as { text?: unknown; content?: unknown };
		const own = typeof node.text === "string" ? node.text : "";
		return `${own} ${contentText(node.content)}`;
	}
	return "";
}

interface NoticeData {
	content: object; // JSON content for tiptap renderer
	id: string;
	isArchived: boolean;
	isPublished: boolean;
	noticeDate: Date;
	title: string;
	type: string;
}

interface NoticeFeedProps {
	notices: NoticeData[];
	/**
	 * Split the register across pages and clip each notice behind a fade.
	 *
	 * True on the archive, which is a browse surface that grows without bound. False on
	 * the current notices register: P.L. 2025 c.72 designates that page as the
	 * Commission's primary publication method, and a required posting may not be put
	 * behind a pagination control or cut off mid-sentence while its Retention Period
	 * runs. The page states that obligation in its own opening paragraph.
	 */
	paginate?: boolean;
}

export function NoticeFeed({ notices, paginate = true }: NoticeFeedProps) {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState<string>("");
	// "all" rather than "" because a Radix SelectItem cannot carry an empty value, and
	// without an item there was no way back to unfiltered except the Clear button — which
	// only appears once something is already filtered.
	const [selectedType, setSelectedType] = useState<string>(ALL);
	const [selectedYear, setSelectedYear] = useState<string>(ALL);
	const itemsPerPage = 5;

	// Get unique types and years for filter options
	const { uniqueTypes, uniqueYears } = useMemo(() => {
		const types = new Set<string>();
		const years = new Set<string>();

		notices?.forEach((notice) => {
			// A notice whose category did not resolve carries an empty type. It must not
			// reach the select: Radix throws on a SelectItem with an empty value, which
			// would take the whole register down in exactly the case the empty string
			// exists to handle. An unresolved category is not a filterable kind.
			if (notice.type) {
				types.add(notice.type);
			}
			const year = notice.noticeDate.getFullYear().toString();
			years.add(year);
		});

		return {
			uniqueTypes: Array.from(types).sort(),
			uniqueYears: Array.from(years).sort().reverse(), // Most recent first
		};
	}, [notices]);

	// Filter notices based on selected filters
	const filteredNotices = useMemo(() => {
		if (!notices) return [];

		const needle = searchQuery.trim().toLowerCase();

		return notices.filter((notice) => {
			const matchesSearch =
				!needle ||
				notice.title.toLowerCase().includes(needle) ||
				contentText(notice.content).toLowerCase().includes(needle);
			const matchesType = selectedType === ALL || notice.type === selectedType;
			const matchesYear =
				selectedYear === ALL ||
				notice.noticeDate.getFullYear().toString() === selectedYear;

			return matchesSearch && matchesType && matchesYear;
		});
	}, [notices, searchQuery, selectedType, selectedYear]);

	// Calculate pagination
	const totalPages = paginate
		? Math.ceil(filteredNotices.length / itemsPerPage)
		: 1;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedNotices = paginate
		? filteredNotices.slice(startIndex, startIndex + itemsPerPage)
		: filteredNotices;

	// Reset to first page when filters change
	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setCurrentPage(1);
	};

	const handleTypeChange = (value: string) => {
		setSelectedType(value);
		setCurrentPage(1);
	};

	const handleYearChange = (value: string) => {
		setSelectedYear(value);
		setCurrentPage(1);
	};

	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1));
	};

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	};

	const isFiltered =
		searchQuery !== "" || selectedType !== ALL || selectedYear !== ALL;

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedType(ALL);
		setSelectedYear(ALL);
		setCurrentPage(1);
	};

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-4">
			{/* Filters */}
			<div className="flex flex-col gap-4 rounded-lg bg-gray-50 p-4">
				<div className="flex flex-wrap items-end gap-4">
					<div className="flex min-w-50 flex-col gap-2">
						<Label htmlFor="search-filter">Search notices</Label>
						<Input
							id="search-filter"
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder="Search titles and text..."
							value={searchQuery}
						/>
					</div>

					<div className="flex min-w-35 flex-col gap-2">
						<Label htmlFor="type-filter">Filter by Type</Label>
						<Select onValueChange={handleTypeChange} value={selectedType}>
							<SelectTrigger id="type-filter">
								<SelectValue placeholder="All Types" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>All Types</SelectItem>
								{uniqueTypes.map((type: string) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex min-w-35 flex-col gap-2">
						<Label htmlFor="year-filter">Filter by Year</Label>
						<Select onValueChange={handleYearChange} value={selectedYear}>
							<SelectTrigger id="year-filter">
								<SelectValue placeholder="All Years" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>All Years</SelectItem>
								{uniqueYears.map((year: string) => (
									<SelectItem key={year} value={year}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{isFiltered && (
						<Button onClick={clearFilters} variant="outline">
							Clear Filters
						</Button>
					)}
				</div>

				<div className="text-muted-foreground text-sm">
					Showing {paginatedNotices.length} of {filteredNotices.length} notices
					{filteredNotices.length !== notices?.length &&
						` (${notices?.length} total)`}
				</div>
			</div>

			{/* Pagination */}
			{totalPages > 1 && renderPagination()}

			{/* Notices */}
			<div className="flex flex-col gap-2">
				{paginatedNotices.map((notice) => {
					// `window` does not exist during SSR, and reading it unguarded threw
					// inside the route's Suspense boundary (React #419), bailing the whole
					// route out to a client re-render. The share dialog only mounts on the
					// client, so the empty origin here never reaches server HTML.
					const getShareUrl = () =>
						`${typeof window === "undefined" ? "" : window.location.origin}/notices/${notice.id}`;
					return (
						<PublicNoticeCard
							content={notice.content}
							getShareUrl={getShareUrl}
							isArchived={notice.isArchived}
							isPublished={notice.isPublished}
							key={notice.id}
							noticeDate={notice.noticeDate}
							onNoticeClick={() =>
								navigate({
									params: { noticeId: notice.id },
									to: "/notices/$noticeId",
								})
							}
							title={notice.title}
							truncate={paginate}
							type={notice.type}
						/>
					);
				})}
			</div>

			{/* Pagination */}
			{totalPages > 1 && renderPagination()}

			{/* No results message */}
			{filteredNotices.length === 0 && (
				<div className="py-8 text-center text-muted-foreground">
					{isFiltered
						? "No notices match your search or filters."
						: "There are no notices posted right now."}
				</div>
			)}
		</div>
	);

	function renderPagination() {
		return (
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							className={
								currentPage === 1
									? "pointer-events-none opacity-50"
									: "cursor-pointer"
							}
							onClick={currentPage > 1 ? handlePreviousPage : undefined}
						/>
					</PaginationItem>

					{Array.from({ length: totalPages }, (_, i) => i + 1).map(
						(pageNum) => (
							<PaginationItem key={pageNum}>
								<PaginationLink
									className="cursor-pointer"
									isActive={pageNum === currentPage}
									onClick={() => setCurrentPage(pageNum)}
								>
									{pageNum}
								</PaginationLink>
							</PaginationItem>
						),
					)}

					<PaginationItem>
						<PaginationNext
							className={
								currentPage === totalPages
									? "pointer-events-none opacity-50"
									: "cursor-pointer"
							}
							onClick={currentPage < totalPages ? handleNextPage : undefined}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		);
	}
}
