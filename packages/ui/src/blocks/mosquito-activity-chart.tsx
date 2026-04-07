import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
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

const chartConfig = {
	currentYearCount: {
		label: "Current Year",
		color: "#000000",
	},
	fiveYearAverage: {
		label: "5-Year Average",
		color: "#ec4899",
	},
	rainfall: {
		label: "Rainfall (in)",
		color: "#3b82f6",
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

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<ChartContainer className="h-55 w-full" config={chartConfig}>
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
							opacity={0.3}
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
			</CardContent>
		</Card>
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

	// Compute global week range from the selected year across all groups
	const weekDomain = React.useMemo((): [number, number] => {
		let min = 53;
		let max = 1;
		for (const row of data) {
			if (row.year === selectedYear) {
				if (row.week_number < min) min = row.week_number;
				if (row.week_number > max) max = row.week_number;
			}
		}
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
