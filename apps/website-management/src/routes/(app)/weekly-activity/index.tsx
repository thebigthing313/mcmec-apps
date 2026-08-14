import { MosquitoActivityDataInsertSchema } from "@mcmec/schemas/db/mosquito-activity-data";
import {
	MosquitoActivityCharts,
	type MosquitoActivityRow,
} from "@mcmec/ui/blocks/mosquito-activity-chart";
import { Button } from "@mcmec/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import { Input } from "@mcmec/ui/components/input";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle, Loader2, Upload } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";
import { mosquitoActivityData } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/weekly-activity/")({
	component: RouteComponent,
	loader: async () => {
		await mosquitoActivityData.preload();
		return { crumb: "Weekly Activity" };
	},
});

interface CsvRow {
	species_name: string;
	species_group: string;
	year: string;
	week_number: string;
	mosquito_count: string;
	rainfall_inches: string;
}

interface ParsedRow {
	species_name: string;
	species_group: string;
	year: number;
	week_number: number;
	mosquito_count: number;
	rainfall_inches: number;
}

interface ValidationError {
	row: number;
	message: string;
}

function parseCsvRows(raw: CsvRow[]): {
	rows: ParsedRow[];
	errors: ValidationError[];
} {
	const rows: ParsedRow[] = [];
	const errors: ValidationError[] = [];

	for (let i = 0; i < raw.length; i++) {
		const r = raw[i] as CsvRow;
		const parsed = {
			mosquito_count: Number(r.mosquito_count),
			rainfall_inches: Number(r.rainfall_inches),
			species_group: r.species_group?.trim(),
			species_name: r.species_name?.trim(),
			week_number: Number(r.week_number),
			year: Number(r.year),
		};

		const result = MosquitoActivityDataInsertSchema.safeParse({
			...parsed,
			id: crypto.randomUUID(),
		});

		if (result.success) {
			rows.push(parsed);
		} else {
			const issues = result.error.issues.map((e) => e.message).join("; ");
			errors.push({ message: issues, row: i + 2 }); // +2 for 1-indexed + header
		}
	}

	return { errors, rows };
}

function RouteComponent() {
	const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
		[],
	);
	const [isUploading, setIsUploading] = useState(false);

	// The whole dataset streams in from the on-demand Electric collection, so a re-import
	// shows up here without an explicit refetch.
	const { data: chartData } = useLiveQuery((q) =>
		q.from({ row: mosquitoActivityData }).select(({ row }) => ({
			mosquito_count: row.mosquito_count,
			rainfall_inches: row.rainfall_inches,
			species_group: row.species_group,
			species_name: row.species_name,
			week_number: row.week_number,
			year: row.year,
		})),
	) as { data: MosquitoActivityRow[] };

	const stats = useMemo(() => {
		if (!chartData.length) return null;
		const years = new Set<number>();
		const groups = new Set<string>();
		for (const row of chartData) {
			years.add(row.year);
			groups.add(row.species_group);
		}
		return {
			groups: [...groups].sort(),
			rows: chartData.length,
			years: [...years].sort((a, b) => b - a),
		};
	}, [chartData]);

	// Preview stats for parsed CSV
	const previewStats = useMemo(() => {
		if (!parsedRows) return null;
		const years = new Set<number>();
		const groups = new Set<string>();
		for (const row of parsedRows) {
			years.add(row.year);
			groups.add(row.species_group);
		}
		return {
			groups: [...groups].sort(),
			rows: parsedRows.length,
			years: [...years].sort((a, b) => b - a),
		};
	}, [parsedRows]);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFile = e.target.files?.[0] ?? null;
			setParsedRows(null);
			setValidationErrors([]);

			if (!selectedFile) return;

			Papa.parse<CsvRow>(selectedFile, {
				complete: (results) => {
					if (results.errors.length > 0) {
						setValidationErrors(
							results.errors.map((err) => ({
								message: err.message,
								row: err.row ? err.row + 2 : 0,
							})),
						);
						return;
					}
					const { errors, rows } = parseCsvRows(results.data);
					setValidationErrors(errors);
					if (errors.length === 0) {
						setParsedRows(rows);
					}
				},
				dynamicTyping: false,
				header: true,
				skipEmptyLines: true,
			});
		},
		[],
	);

	const handleUpload = useCallback(async () => {
		if (!parsedRows || parsedRows.length === 0) return;

		setIsUploading(true);
		try {
			// The endpoint replaces every row for the years present in the payload, in one
			// transaction — so a re-imported season swaps cleanly and other years are untouched.
			await apiFetch("/api/mosquito-activity/import", {
				body: JSON.stringify({
					rows: parsedRows.map((row) => ({
						mosquitoCount: row.mosquito_count,
						rainfallInches: row.rainfall_inches,
						speciesGroup: row.species_group,
						speciesName: row.species_name,
						weekNumber: row.week_number,
						year: row.year,
					})),
				}),
				method: "POST",
			});

			toast.success(`Successfully uploaded ${parsedRows.length} rows.`);
			setParsedRows(null);
			setValidationErrors([]);

			// Reset file input
			const fileInput = document.querySelector(
				'input[type="file"]',
			) as HTMLInputElement | null;
			if (fileInput) fileInput.value = "";
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "An unexpected error occurred during upload.",
			);
		} finally {
			setIsUploading(false);
		}
	}, [parsedRows]);

	return (
		<div className="space-y-6">
			<h1 className="font-semibold text-2xl">Weekly Mosquito Activity</h1>

			{/* Upload Section */}
			<Card>
				<CardHeader>
					<CardTitle>Upload CSV Data</CardTitle>
					<CardDescription>
						Upload a CSV file with columns: species_name, species_group, year,
						week_number, mosquito_count, rainfall_inches. Every row for the
						years in the file is replaced; other years are left alone.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input accept=".csv" onChange={handleFileChange} type="file" />

					{/* Validation Errors */}
					{validationErrors.length > 0 && (
						<div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
							<div className="flex items-center gap-2 font-medium text-destructive text-sm">
								<AlertTriangle className="h-4 w-4" />
								{validationErrors.length} validation error(s) found
							</div>
							<ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
								{validationErrors.map((err) => (
									<li
										className="text-destructive"
										key={`${err.row}-${err.message}`}
									>
										Row {err.row}: {err.message}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Preview */}
					{parsedRows && previewStats && (
						<div className="rounded-md border border-green-500/50 bg-green-500/10 p-4">
							<div className="flex items-center gap-2 font-medium text-green-700 text-sm dark:text-green-400">
								<CheckCircle className="h-4 w-4" />
								CSV parsed successfully
							</div>
							<div className="mt-2 space-y-1 text-sm">
								<p>
									<strong>{previewStats.rows}</strong> rows
								</p>
								<p>
									<strong>Years:</strong> {previewStats.years.join(", ")}
								</p>
								<p>
									<strong>Species Groups:</strong>{" "}
									{previewStats.groups.join(", ")}
								</p>
							</div>
							<Button
								className="mt-4"
								disabled={isUploading}
								onClick={handleUpload}
								variant="destructive"
							>
								{isUploading ? (
									<>
										<Loader2 className="animate-spin" />
										Uploading...
									</>
								) : (
									<>
										<Upload />
										Confirm &amp; Replace These Years
									</>
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Current Data Stats */}
			{stats && (
				<Card>
					<CardHeader>
						<CardTitle>Current Data</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-6 text-sm">
							<div>
								<span className="text-muted-foreground">Total Rows:</span>{" "}
								<strong>{stats.rows}</strong>
							</div>
							<div>
								<span className="text-muted-foreground">Years:</span>{" "}
								<strong>{stats.years.join(", ")}</strong>
							</div>
							<div>
								<span className="text-muted-foreground">Species Groups:</span>{" "}
								<strong>{stats.groups.join(", ")}</strong>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Charts */}
			{chartData.length > 0 && <MosquitoActivityCharts data={chartData} />}
		</div>
	);
}
