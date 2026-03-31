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
}

export function NoticeFeed({ notices }: NoticeFeedProps) {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedType, setSelectedType] = useState<string>("");
	const [selectedYear, setSelectedYear] = useState<string>("");
	const itemsPerPage = 5;

	// Get unique types and years for filter options
	const { uniqueTypes, uniqueYears } = useMemo(() => {
		const types = new Set<string>();
		const years = new Set<string>();

		notices?.forEach((notice) => {
			types.add(notice.type);
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

		return notices.filter((notice) => {
			const matchesSearch =
				!searchQuery ||
				notice.title.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesType = !selectedType || notice.type === selectedType;
			const matchesYear =
				!selectedYear ||
				notice.noticeDate.getFullYear().toString() === selectedYear;

			return matchesSearch && matchesType && matchesYear;
		});
	}, [notices, searchQuery, selectedType, selectedYear]);

	// Calculate pagination
	const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedNotices = filteredNotices.slice(
		startIndex,
		startIndex + itemsPerPage,
	);

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

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedType("");
		setSelectedYear("");
		setCurrentPage(1);
	};

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-4">
			{/* Filters */}
			<div className="flex flex-col gap-4 rounded-lg bg-gray-50 p-4">
				<div className="flex flex-wrap items-end gap-4">
					<div className="flex min-w-50 flex-col gap-2">
						<Label htmlFor="search-filter">Search by title</Label>
						<Input
							id="search-filter"
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder="Search..."
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
								{uniqueYears.map((year: string) => (
									<SelectItem key={year} value={year}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{(searchQuery || selectedType || selectedYear) && (
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
					const shareUrl = `${window.location.origin}/notices/${notice.id}`;
					return (
						<PublicNoticeCard
							content={notice.content}
							getShareUrl={() => shareUrl}
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
					No notices found matching the selected filters.
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
