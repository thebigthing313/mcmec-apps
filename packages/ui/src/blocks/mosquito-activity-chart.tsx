import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@mcmec/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@mcmec/ui/components/chart";
import * as React from "react";
import { Bar, ComposedChart, Line, XAxis, YAxis } from "recharts";

export interface MosquitoActivityRow {
	species_name: string;
	species_group: string;
	year: number;
	week_number: number;
	mosquito_count: number;
	rainfall_inches: number;
}

interface ChartDataPoint {
	week_number: number;
	currentYearCount: number;
	fiveYearAverage: number;
	rainfall: number;
}

/*
 * Series colours come from the palette, not from hex literals.
 *
 * The current year takes Commission Green because it is the series the page exists to
 * show; the five-year average takes chart-1 and stays dashed, so the two are told apart
 * by stroke pattern and not by colour alone. Rainfall takes chart-5 at full opacity —
 * it used to be drawn at 0.3, which put the bars at 1.41:1 against the card and made
 * the one thing on the chart with a filled area the hardest thing on it to see.
 */
const chartConfig = {
	currentYearCount: {
		label: "Current Year",
		color: "var(--primary)",
	},
	fiveYearAverage: {
		label: "5-Year Average",
		color: "var(--chart-1)",
	},
	rainfall: {
		label: "Rainfall (in)",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

function transformData(
	rows: MosquitoActivityRow[],
	selectedYear: number,
	rainfallByWeek: Map<number, number>,
	speciesGroup?: string,
	weekDomain?: [number, number],
): ChartDataPoint[] {
	const filtered = speciesGroup
		? rows.filter((r) => r.species_group === speciesGroup)
		: rows;

	// Current year data: sum mosquito_count per week
	const currentYearRows = filtered.filter((r) => r.year === selectedYear);
	const currentByWeek = new Map<number, number>();
	for (const row of currentYearRows) {
		const existing = currentByWeek.get(row.week_number) ?? 0;
		currentByWeek.set(row.week_number, existing + row.mosquito_count);
	}

	// 5-year average: average mosquito_count per week from (selectedYear-5) to (selectedYear-1)
	const avgYearStart = selectedYear - 5;
	const avgYearEnd = selectedYear - 1;
	const historicalRows = filtered.filter(
		(r) => r.year >= avgYearStart && r.year <= avgYearEnd,
	);
	const historicalByWeek = new Map<
		number,
		{ total: number; years: Set<number> }
	>();
	for (const row of historicalRows) {
		const existing = historicalByWeek.get(row.week_number) ?? {
			total: 0,
			years: new Set<number>(),
		};
		existing.total += row.mosquito_count;
		existing.years.add(row.year);
		historicalByWeek.set(row.week_number, existing);
	}

	// Build week list spanning full domain (fill 0s for missing weeks)
	const weeks: number[] = [];
	if (weekDomain) {
		for (let w = weekDomain[0]; w <= weekDomain[1]; w++) {
			weeks.push(w);
		}
	} else {
		weeks.push(...[...currentByWeek.keys()].sort((a, b) => a - b));
	}

	return weeks.map((week) => {
		const count = currentByWeek.get(week) ?? 0;
		const historical = historicalByWeek.get(week);
		const avgCount =
			historical && historical.years.size > 0
				? historical.total / historical.years.size
				: 0;

		return {
			currentYearCount: count,
			fiveYearAverage: Math.round(avgCount * 100) / 100,
			rainfall: rainfallByWeek.get(week) ?? 0,
			week_number: week,
		};
	});
}

/** A stable id fragment from a chart title, so each heading can be referenced. */
function slug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export interface MosquitoActivityChartProps {
	data: MosquitoActivityRow[];
	title: string;
	description?: string;
	selectedYear: number;
	speciesGroup?: string;
	weekDomain?: [number, number];
	maxRainfall?: number;
}

export function MosquitoActivityChart({
	data,
	title,
	description,
	selectedYear,
	speciesGroup,
	weekDomain,
	maxRainfall,
}: MosquitoActivityChartProps) {
	// Build global rainfall map from ALL rows (not filtered by group)
	const rainfallByWeek = React.useMemo(() => {
		const map = new Map<number, number>();
		for (const row of data) {
			if (row.year === selectedYear) {
				const existing = map.get(row.week_number) ?? 0;
				map.set(row.week_number, Math.max(existing, row.rainfall_inches));
			}
		}
		return map;
	}, [data, selectedYear]);

	const chartData = React.useMemo(
		() =>
			transformData(
				data,
				selectedYear,
				rainfallByWeek,
				speciesGroup,
				weekDomain,
			),
		[data, selectedYear, rainfallByWeek, speciesGroup, weekDomain],
	);

	if (chartData.length === 0) {
		return null;
	}

	const headingId = `mosquito-activity-${slug(title)}`;
	const weeksShown = chartData.map((d) => d.week_number);
	const firstWeek = weeksShown[0];
	const lastWeek = weeksShown[weeksShown.length - 1];

	/*
	 * What the chart says, for anyone who cannot see it.
	 *
	 * `role="img"` on the container collapses the whole recharts subtree to this one
	 * label, which is the point: left exposed, the SVG announces a stream of unlabelled
	 * groups and tick text that conveys nothing. The label is the summary; the table
	 * below is the equivalent, and between them the chart is no longer the only way to
	 * reach the data.
	 */
	const chartSummary = `Line chart. ${title}, weeks ${firstWeek} to ${lastWeek} of ${selectedYear}: trapped mosquito count for the current year, the five-year average for the same weeks, and weekly rainfall in inches. The same figures follow in a table.`;

	return (
		<section aria-labelledby={headingId}>
			<Card>
				<CardHeader className="text-center">
					{/*
					 * A real heading, not a styled div. CardTitle renders a div, so eight charts
					 * put eight titles on the page and none of them appeared in the heading
					 * outline — the page's only headings were its h1 and the footer's.
					 */}
					<h2 className="font-semibold leading-none" id={headingId}>
						{title}
					</h2>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<ChartContainer
						aria-label={chartSummary}
						className="h-55 w-full"
						config={chartConfig}
						role="img"
					>
						<ComposedChart
							data={chartData}
							margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
						>
							<XAxis
								axisLine={false}
								dataKey="week_number"
								domain={weekDomain ?? ["dataMin", "dataMax"]}
								interval={0}
								label={{
									value: "Week Number",
									position: "insideBottom",
									offset: -5,
								}}
								tickFormatter={(week: number) =>
									week % 2 === 0 ? String(week) : ""
								}
								tickLine={false}
								ticks={
									weekDomain
										? Array.from(
												{ length: weekDomain[1] - weekDomain[0] + 1 },
												(_, i) => weekDomain[0] + i,
											)
										: undefined
								}
								type="number"
							/>
							<YAxis
								axisLine={false}
								label={{
									value: "Mosquito Count",
									angle: -90,
									position: "insideLeft",
									offset: 0,
								}}
								tickLine={false}
								yAxisId="left"
							/>
							<YAxis
								axisLine={false}
								domain={maxRainfall != null ? [0, maxRainfall] : undefined}
								interval={0}
								label={{
									value: "Rainfall (in)",
									angle: 90,
									position: "insideRight",
									offset: 0,
								}}
								orientation="right"
								tickCount={
									maxRainfall != null ? Math.ceil(maxRainfall) + 1 : undefined
								}
								tickLine={false}
								yAxisId="right"
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							<ChartLegend content={<ChartLegendContent />} />
							<Bar
								dataKey="rainfall"
								fill="var(--color-rainfall)"
								radius={[2, 2, 0, 0]}
								yAxisId="right"
							/>
							<Line
								dataKey="currentYearCount"
								dot={false}
								stroke="var(--color-currentYearCount)"
								strokeWidth={2}
								type="monotone"
								yAxisId="left"
							/>
							<Line
								dataKey="fiveYearAverage"
								dot={false}
								stroke="var(--color-fiveYearAverage)"
								strokeDasharray="5 5"
								strokeWidth={2}
								type="monotone"
								yAxisId="left"
							/>
						</ComposedChart>
					</ChartContainer>

					{/*
					 * The text equivalent, and the reason the chart above can be a single
					 * labelled image. Closed by default so the page looks as it did, but open
					 * to anyone — a resident who wants the actual count for their week gets it
					 * here rather than by reading pixels off a line.
					 */}
					<details className="mt-4">
						<summary className="cursor-pointer text-muted-foreground text-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
							Show the numbers
						</summary>
						<div className="mt-3 overflow-x-auto">
							<table className="w-full border-collapse text-sm">
								<caption className="sr-only">
									{`${title}: weekly trapped mosquito count for ${selectedYear}, the five-year average for the same weeks, and weekly rainfall in inches.`}
								</caption>
								<thead>
									<tr className="border-b text-left">
										<th className="py-2 pr-4 font-medium" scope="col">
											Week
										</th>
										<th
											className="py-2 pr-4 text-right font-medium"
											scope="col"
										>
											{selectedYear}
										</th>
										<th
											className="py-2 pr-4 text-right font-medium"
											scope="col"
										>
											5-year average
										</th>
										<th className="py-2 text-right font-medium" scope="col">
											Rainfall (in)
										</th>
									</tr>
								</thead>
								<tbody>
									{chartData.map((row) => (
										<tr
											className="border-b last:border-0"
											key={row.week_number}
										>
											<th
												className="py-1.5 pr-4 font-normal text-muted-foreground"
												scope="row"
											>
												{row.week_number}
											</th>
											<td className="py-1.5 pr-4 text-right tabular-nums">
												{row.currentYearCount.toLocaleString()}
											</td>
											<td className="py-1.5 pr-4 text-right tabular-nums">
												{row.fiveYearAverage.toLocaleString()}
											</td>
											<td className="py-1.5 text-right tabular-nums">
												{row.rainfall.toFixed(2)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</details>
				</CardContent>
			</Card>
		</section>
	);
}

export interface MosquitoActivityChartsProps {
	data: MosquitoActivityRow[];
}

export function MosquitoActivityCharts({ data }: MosquitoActivityChartsProps) {
	const selectedYear = React.useMemo(() => {
		let max = 0;
		for (const row of data) {
			if (row.year > max) max = row.year;
		}
		return max;
	}, [data]);

	const speciesGroups = React.useMemo(() => {
		const groups = new Set<string>();
		for (const row of data) {
			groups.add(row.species_group);
		}
		return [...groups].sort();
	}, [data]);

	// Compute global week range across the selected year and the 5-year
	// historical window so charts still render the average line and zero-fill
	// the current year when only a few weeks have been uploaded.
	const weekDomain = React.useMemo((): [number, number] => {
		const avgYearStart = selectedYear - 5;
		const avgYearEnd = selectedYear - 1;
		let min = 53;
		let max = 1;
		for (const row of data) {
			const inCurrent = row.year === selectedYear;
			const inHistory = row.year >= avgYearStart && row.year <= avgYearEnd;
			if (!(inCurrent || inHistory)) continue;
			if (row.week_number < min) min = row.week_number;
			if (row.week_number > max) max = row.week_number;
		}
		if (min > max) return [1, 1];
		return [min, max];
	}, [data, selectedYear]);

	// Compute global max rainfall for the selected year to normalize across charts
	const maxRainfall = React.useMemo(() => {
		let max = 0;
		for (const row of data) {
			if (row.year === selectedYear && row.rainfall_inches > max) {
				max = row.rainfall_inches;
			}
		}
		return Math.ceil(max);
	}, [data, selectedYear]);

	if (selectedYear === 0) return null;

	return (
		<div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
			<MosquitoActivityChart
				data={data}
				description={`${selectedYear} vs. 5-year average`}
				maxRainfall={maxRainfall}
				selectedYear={selectedYear}
				title="All Groups — Aggregated"
				weekDomain={weekDomain}
			/>
			{speciesGroups.map((group) => (
				<MosquitoActivityChart
					data={data}
					description={`${selectedYear} vs. 5-year average`}
					key={group}
					maxRainfall={maxRainfall}
					selectedYear={selectedYear}
					speciesGroup={group}
					title={group}
					weekDomain={weekDomain}
				/>
			))}
		</div>
	);
}
