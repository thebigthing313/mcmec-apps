import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../components/empty";
import { Input } from "../components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/select";
import { Skeleton } from "../components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../components/table";
import { cn } from "../lib/utils";
import { type RowAction, RowActionsMenu } from "./row-actions-menu";

/**
 * The one index page.
 *
 * Eleven index routes across three staff applications had each hand-rolled the same screen, and
 * the count of the duplication is the argument: nine copies of the sortable column header (none
 * of which emitted `aria-sort`), eight copies of the same forty-five-line pagination footer, six
 * different spellings of the empty state, three incompatible ways of getting from a row to its
 * record — and **zero** implementations of a loading state, so every one of them told the user
 * "No results." while its Electric shape was still streaming. On a statutory public record,
 * "there are no notices" is a sentence with legal weight and must never be said by accident.
 *
 * This block is deliberately opinionated, because the alternative was tried and it produced the
 * eleven. Three things are therefore not optional:
 *
 * - **`renderRowLink` is required.** The identity cell is always a real link, so an index that
 *   cannot be operated by keyboard does not compile. Four of the eleven made the whole `<tr>` a
 *   click target with no anchor, which left a screen-reader user on a terminal page and cost
 *   everyone middle-click, Cmd-click, and open-in-new-tab.
 * - **`getRowLabel` is required.** It names the row in the row-actions trigger, because ten
 *   buttons all called "Row actions" tell a screen reader nothing about *which* record is about
 *   to be published.
 * - **`state` and `emptyState` are required.** Loading and empty are different screens.
 *
 * What stays with the caller is what is genuinely per-domain: the columns and their renderers,
 * the `rowActions` builders (ADR 0001 — the route owns the command vocabulary and passes it in,
 * so this block never learns it), which lifecycle actions a row offers at all, and the filter
 * dimensions. The arrangement is ours; the domain is theirs.
 *
 * The caller renders its own link rather than handing over a `Link` component and a props object.
 * This package must not import an application's route registry, and a render callback keeps the
 * route's own `to`/`params` fully type-checked at the call site — which a `ComponentType` generic
 * cannot, because inference resolves the router's `params` to its internal reducer type.
 */
export interface RecordIndexColumn<TRow> {
	/** Stable id; also the value stored in the URL's `sort` parameter. */
	id: string;
	/** Column heading. Sentence case — uppercase is structural here, and a table head is not one of its three homes. */
	header: string;
	cell: (row: TRow) => ReactNode;
	/**
	 * The value this column sorts on. Omit to make the column unsortable — which is the right
	 * answer for an actions column or a cluster of links, and the reason `sortable` is not a
	 * separate flag that could disagree with this one.
	 */
	sortValue?: (row: TRow) => string | number | Date | null | undefined;
	/** Right-align, for counts and dates that read better on a common right edge. */
	align?: "end";
	/** Extra classes for the cell — a `max-w-[36ch] truncate` on a column that can run long. */
	cellClassName?: string;
	/**
	 * Marks the column carrying the record's identity. Its cell becomes the link to the record.
	 * Exactly one column must set it.
	 */
	identity?: boolean;
}

/** The slice of a route's search params this block owns. */
export interface RecordIndexSearch {
	q: string;
	page: number;
	size: number;
	sort: string;
	dir: "asc" | "desc";
}

export const RECORD_INDEX_PAGE_SIZES = [25, 50, 100] as const;

/**
 * Default page size.
 *
 * Twenty-five rather than the ten every hand-rolled table defaulted to: these screens are used at
 * a desk on a large display (PRODUCT.md), where ten rows left half the viewport empty while
 * splitting thirty-five records across four pages.
 */
export const RECORD_INDEX_DEFAULT_SIZE = 25;

/**
 * Normalises whatever is in the URL into a complete search state.
 *
 * Belongs here rather than in each route so that sort and page survive a round trip to a detail
 * screen and back — the single most-felt gap in the previous eleven, where returning from a
 * record dropped you on page one with the default sort. Written to be dropped straight into
 * TanStack Router's `validateSearch`.
 */
export function parseRecordIndexSearch(
	raw: Record<string, unknown>,
	defaults: { id: string; dir?: "asc" | "desc" },
): RecordIndexSearch {
	const size = Number(raw.size);
	const page = Number(raw.page);
	return {
		dir:
			raw.dir === "asc" || raw.dir === "desc"
				? raw.dir
				: (defaults.dir ?? "desc"),
		page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
		q: typeof raw.q === "string" ? raw.q : "",
		size: RECORD_INDEX_PAGE_SIZES.includes(
			size as (typeof RECORD_INDEX_PAGE_SIZES)[number],
		)
			? size
			: RECORD_INDEX_DEFAULT_SIZE,
		sort: typeof raw.sort === "string" && raw.sort ? raw.sort : defaults.id,
	};
}

export interface RecordIndexProps<TRow> {
	/** Page title. Also the table's accessible name, so it is never an unnamed grid. */
	title: string;
	description?: ReactNode;
	/** The screen's one primary action, typically "Create …". */
	actions?: ReactNode;

	columns: RecordIndexColumn<TRow>[];
	rows: TRow[];
	/** `loading` renders skeleton rows. Never render an empty state over data that has not arrived. */
	state: "loading" | "ready";
	getRowKey: (row: TRow) => string;
	/** Names the row for assistive technology — "Publish, 2026 Public Notice, 7/20/2026". */
	getRowLabel: (row: TRow) => string;

	/**
	 * Renders the identity cell as a link to the record, using the caller's own typed router.
	 * Required, and the reason an index that cannot be reached by keyboard does not compile.
	 * Spread `className` onto the link so it keeps the focus ring and hover treatment.
	 */
	renderRowLink: (args: {
		row: TRow;
		className: string;
		children: ReactNode;
	}) => ReactNode;

	/** ADR 0001 shortcuts. The route builds them; this block never learns the command vocabulary. */
	rowActions?: (row: TRow) => RowAction[];

	/**
	 * The route's validated search. Every field is optional so a link to this route from anywhere
	 * else needs no search object at all; the defaults are filled in here.
	 */
	search: Partial<RecordIndexSearch>;
	onSearchChange: (next: RecordIndexSearch) => void;
	/** Which column sorts by default, and which way. */
	defaultSort: { id: string; dir?: "asc" | "desc" };
	/**
	 * Free-text haystack for a row. Supplying it turns the search field on; omitting it hides the
	 * field entirely, so a screen without searchable text never shows a box that does nothing.
	 */
	getSearchText?: (row: TRow) => string;
	searchPlaceholder?: string;
	/** Domain filter controls — a status Select, a year picker. Rendered beside the search field. */
	filters?: ReactNode;
	/** True when a `filters` control is narrowing the list, so the empty state can say so. */
	filtersActive?: boolean;
	/** Clears the caller's own filters. Required whenever `filtersActive` can be true. */
	onClearFilters?: () => void;

	emptyState: {
		icon: ComponentType<{ className?: string }>;
		title: string;
		description: string;
		action?: ReactNode;
	};
}

export function RecordIndex<TRow>({
	actions,
	columns,
	defaultSort,
	description,
	emptyState,
	filters,
	filtersActive = false,
	getRowKey,
	getRowLabel,
	getSearchText,
	onClearFilters,
	onSearchChange,
	renderRowLink,
	rowActions,
	rows,
	search: rawSearch,
	searchPlaceholder = "Search",
	state,
	title,
}: RecordIndexProps<TRow>) {
	const search = parseRecordIndexSearch(rawSearch, defaultSort);
	const identityId = columns.find((c) => c.identity)?.id ?? columns[0]?.id;

	const filtered = useMemo(() => {
		if (!getSearchText || !search.q.trim()) return rows;
		const needle = search.q.trim().toLowerCase();
		return rows.filter((row) =>
			getSearchText(row).toLowerCase().includes(needle),
		);
	}, [rows, search.q, getSearchText]);

	const sorted = useMemo(() => {
		const column = columns.find((c) => c.id === search.sort);
		if (!column?.sortValue) return filtered;
		const read = column.sortValue;
		const factor = search.dir === "asc" ? 1 : -1;
		// Copy first: `rows` is a live-query result and sorting it in place mutates the cache.
		return [...filtered].sort((a, b) => factor * compare(read(a), read(b)));
	}, [filtered, columns, search.sort, search.dir]);

	const pageCount = Math.max(1, Math.ceil(sorted.length / search.size));
	// Clamp rather than trust: deleting the last record on page 4, or a hand-edited URL, would
	// otherwise leave the user on a page that renders nothing and looks like data loss.
	const page = Math.min(search.page, pageCount);
	const pageRows = sorted.slice((page - 1) * search.size, page * search.size);

	const columnCount = columns.length + (rowActions ? 1 : 0);
	const narrowing = Boolean(search.q.trim()) || filtersActive;

	const set = (patch: Partial<RecordIndexSearch>) =>
		onSearchChange({ ...search, ...patch });

	const toggleSort = (column: RecordIndexColumn<TRow>) => {
		if (!column.sortValue) return;
		if (search.sort === column.id) {
			set({ dir: search.dir === "asc" ? "desc" : "asc", page: 1 });
		} else {
			set({ dir: "asc", page: 1, sort: column.id });
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<PageHeading actions={actions} description={description} title={title} />

			{(getSearchText || filters) && (
				<div className="flex flex-wrap items-center gap-2">
					{getSearchText ? (
						<SearchField
							label={`Search ${title}`}
							onCommit={(q) => set({ page: 1, q })}
							placeholder={searchPlaceholder}
							value={search.q}
						/>
					) : null}
					{filters}
					{narrowing ? (
						<Button
							onClick={() => {
								onClearFilters?.();
								set({ page: 1, q: "" });
							}}
							size="sm"
							variant="ghost"
						>
							<X />
							Clear
						</Button>
					) : null}
					{state === "ready" ? (
						// A count is the cheapest reassurance a register can give: it says the list
						// you are looking at is the whole list.
						<p
							aria-live="polite"
							className="ml-auto text-muted-foreground text-sm"
						>
							{sorted.length}
							{narrowing ? ` of ${rows.length}` : ""}
						</p>
					) : null}
				</div>
			)}

			<div className="overflow-hidden rounded-xl border">
				<div className="relative w-full overflow-x-auto">
					<Table aria-label={title}>
						<TableHeader>
							<TableRow>
								{columns.map((column) => {
									const active = search.sort === column.id;
									return (
										<TableHead
											aria-sort={
												// The one thing all nine previous implementations
												// omitted: sort direction existed only as an icon.
												column.sortValue
													? active
														? search.dir === "asc"
															? "ascending"
															: "descending"
														: "none"
													: undefined
											}
											className={cn(column.align === "end" && "text-right")}
											key={column.id}
										>
											{column.sortValue ? (
												<Button
													className={cn(
														"-ml-3 h-8 data-[active=true]:text-foreground",
														column.align === "end" && "-mr-3 -ml-0",
													)}
													data-active={active}
													onClick={() => toggleSort(column)}
													variant="ghost"
												>
													{column.header}
													{active ? (
														search.dir === "asc" ? (
															<ArrowUp />
														) : (
															<ArrowDown />
														)
													) : (
														<ArrowUpDown className="text-muted-foreground" />
													)}
												</Button>
											) : (
												column.header
											)}
										</TableHead>
									);
								})}
								{rowActions ? (
									<TableHead className="w-12">
										<span className="sr-only">Actions</span>
									</TableHead>
								) : null}
							</TableRow>
						</TableHeader>
						<TableBody>
							{state === "loading" ? (
								<LoadingRows columns={columns} withActions={!!rowActions} />
							) : pageRows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell className="p-0" colSpan={columnCount}>
										{narrowing ? (
											<Empty className="border-0 py-12">
												<EmptyHeader>
													<EmptyTitle>No matches</EmptyTitle>
													<EmptyDescription>
														Nothing here matches the current search or filters.
													</EmptyDescription>
												</EmptyHeader>
												<EmptyContent>
													<Button
														onClick={() => {
															onClearFilters?.();
															set({ page: 1, q: "" });
														}}
														size="sm"
														variant="outline"
													>
														Clear search and filters
													</Button>
												</EmptyContent>
											</Empty>
										) : (
											<Empty className="border-0 py-12">
												<EmptyHeader>
													<EmptyMedia variant="icon">
														<emptyState.icon />
													</EmptyMedia>
													<EmptyTitle>{emptyState.title}</EmptyTitle>
													<EmptyDescription>
														{emptyState.description}
													</EmptyDescription>
												</EmptyHeader>
												{emptyState.action ? (
													<EmptyContent>{emptyState.action}</EmptyContent>
												) : null}
											</Empty>
										)}
									</TableCell>
								</TableRow>
							) : (
								pageRows.map((row) => (
									<TableRow key={getRowKey(row)}>
										{columns.map((column) => (
											<TableCell
												className={cn(
													column.align === "end" && "text-right",
													column.cellClassName,
												)}
												key={column.id}
											>
												{column.id === identityId
													? // The record's identity is the link. Not the whole
														// row: a stretched overlay would take text
														// selection away from every other cell, and a
														// duplicate row `onClick` beside a link is how a
														// double-click fires two navigations.
														renderRowLink({
															children: column.cell(row),
															className:
																"-mx-1 block rounded-sm px-1 font-medium hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
															row,
														})
													: column.cell(row)}
											</TableCell>
										))}
										{rowActions ? (
											<TableCell className="w-12">
												<RowActionsMenu
													actions={rowActions(row)}
													label={`Actions for ${getRowLabel(row)}`}
												/>
											</TableCell>
										) : null}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{state === "ready" && sorted.length > search.size ? (
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<label
							className="text-muted-foreground text-sm"
							htmlFor="record-index-size"
						>
							Rows per page
						</label>
						<Select
							onValueChange={(value) => set({ page: 1, size: Number(value) })}
							value={`${search.size}`}
						>
							<SelectTrigger className="h-8 w-20" id="record-index-size">
								<SelectValue />
							</SelectTrigger>
							<SelectContent side="top">
								{RECORD_INDEX_PAGE_SIZES.map((size) => (
									<SelectItem key={size} value={`${size}`}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-4">
						<p aria-live="polite" className="font-medium text-sm tabular-nums">
							Page {page} of {pageCount}
						</p>
						<div className="flex items-center gap-2">
							<Button
								disabled={page <= 1}
								onClick={() => set({ page: page - 1 })}
								size="sm"
								variant="outline"
							>
								Previous
							</Button>
							<Button
								disabled={page >= pageCount}
								onClick={() => set({ page: page + 1 })}
								size="sm"
								variant="outline"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}

/**
 * The search box, with its own state and a debounce.
 *
 * Writing every keystroke straight to the URL looked right and was not: the navigation re-renders
 * the field mid-word, so typing "surplus" put `q=s` in the URL and dropped the rest on the floor.
 * It also pushed one history entry per character, which turns the back button into an undo log for
 * typing. Local state owns what is being typed; the URL is told once the typing pauses.
 */
function SearchField({
	label,
	onCommit,
	placeholder,
	value,
}: {
	label: string;
	onCommit: (q: string) => void;
	placeholder: string;
	value: string;
}) {
	const [draft, setDraft] = useState(value);
	// Follow the URL when it changes from outside — a Clear button, a back navigation — without
	// clobbering what someone is part-way through typing.
	const committed = useRef(value);
	useEffect(() => {
		if (value !== committed.current) {
			committed.current = value;
			setDraft(value);
		}
	}, [value]);

	useEffect(() => {
		if (draft === committed.current) return;
		const timer = setTimeout(() => {
			committed.current = draft;
			onCommit(draft);
		}, 250);
		return () => clearTimeout(timer);
	}, [draft, onCommit]);

	return (
		<div className="relative min-w-56 flex-1 sm:max-w-xs">
			<Search
				aria-hidden="true"
				className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				aria-label={label}
				className="pl-8"
				onChange={(event) => setDraft(event.target.value)}
				placeholder={placeholder}
				type="search"
				value={draft}
			/>
		</div>
	);
}

/**
 * The page heading, inlined rather than importing `PageHeader`, because this block owns the whole
 * screen and two of the eleven routes proved that a separately-importable header is a header some
 * screens simply forget: `meetings` and `documents` open on a bare button with no `h1` at all.
 * Taking `title` as a required prop makes that unrepresentable.
 */
function PageHeading({
	actions,
	description,
	title,
}: {
	actions?: ReactNode;
	description?: ReactNode;
	title: string;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4">
			<div className="min-w-0">
				<h1 className="font-semibold text-foreground text-xl leading-tight">
					{title}
				</h1>
				{description ? (
					<p className="mt-1 text-muted-foreground text-sm leading-relaxed">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}

/** Fixed keys so the skeleton rows are not keyed by array index. */
const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

function LoadingRows<TRow>({
	columns,
	withActions,
}: {
	columns: RecordIndexColumn<TRow>[];
	withActions: boolean;
}) {
	return (
		<>
			{SKELETON_ROWS.map((rowKey) => (
				<TableRow key={rowKey}>
					{columns.map((column) => (
						<TableCell key={column.id}>
							<Skeleton className="h-4 w-full max-w-40" />
						</TableCell>
					))}
					{withActions ? (
						<TableCell className="w-12">
							<Skeleton className="ml-auto size-8 rounded-md" />
						</TableCell>
					) : null}
				</TableRow>
			))}
		</>
	);
}

function compare(
	a: string | number | Date | null | undefined,
	b: string | number | Date | null | undefined,
): number {
	// Blanks sort last in both directions; a record missing a date is not "earliest".
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b), undefined, {
		numeric: true,
		sensitivity: "base",
	});
}
