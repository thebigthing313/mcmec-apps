import { MosquitoActivityDataInsertSchema } from "@mcmec/supabase/db/mosquito-activity-data";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle, Loader2, Upload } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/queryClient";

export const Route = createFileRoute("/(app)/weekly-activity/")({
	component: RouteComponent,
	loader: () => {
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
	const [file, setFile] = useState<File | null>(null);
	const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
		[],
	);
	const [isUploading, setIsUploading] = useState(false);
	const queryClient = useQueryClient();

	// Fetch all rows with pagination to avoid PostgREST 1000-row limit
	const { data: chartData = [] } = useQuery<MosquitoActivityRow[]>({
		queryFn: async () => {
			const allRows: MosquitoActivityRow[] = [];
			const PAGE_SIZE = 1000;
			let from = 0;

			while (true) {
				const { data, error } = await supabase
					.from("mosquito_activity_data")
					.select(
						"species_name, species_group, year, week_number, mosquito_count, rainfall_inches",
					)
					.range(from, from + PAGE_SIZE - 1);
				if (error) throw error;
				for (const row of data) {
					allRows.push({
						mosquito_count: row.mosquito_count,
						rainfall_inches: row.rainfall_inches,
						species_group: row.species_group,
						species_name: row.species_name,
						week_number: row.week_number,
						year: row.year,
					});
				}
				if (data.length < PAGE_SIZE) break;
				from += PAGE_SIZE;
			}

			return allRows;
		},
		queryKey: ["mosquito_activity_data"],
		staleTime: 1000 * 60 * 5,
	});

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
			setFile(selectedFile);
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
			// Delete all existing data
			const { error: deleteError } = await supabase
				.from("mosquito_activity_data")
				.delete()
				.neq("id", "00000000-0000-0000-0000-000000000000");

			if (deleteError) {
				toast.error(`Failed to clear existing data: ${deleteError.message}`);
				return;
			}

			// Batch insert in chunks of 500
			const BATCH_SIZE = 500;
			for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
				const batch = parsedRows.slice(i, i + BATCH_SIZE).map((row) => ({
					id: crypto.randomUUID(),
					mosquito_count: row.mosquito_count,
					rainfall_inches: row.rainfall_inches,
					species_group: row.species_group,
					species_name: row.species_name,
					week_number: row.week_number,
					year: row.year,
				}));

				const { error: insertError } = await supabase
					.from("mosquito_activity_data")
					.insert(batch);

				if (insertError) {
					toast.error(
						`Failed to insert batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`,
					);
					return;
				}
			}

			toast.success(`Successfully uploaded ${parsedRows.length} rows.`);
			setParsedRows(null);
			setFile(null);
			setValidationErrors([]);

			// Refetch chart data
			queryClient.invalidateQueries({
				queryKey: ["mosquito_activity_data"],
			});

			// Reset file input
			const fileInput = document.querySelector(
				'input[type="file"]',
			) as HTMLInputElement | null;
			if (fileInput) fileInput.value = "";
		} catch (err) {
			toast.error("An unexpected error occurred during upload.");
		} finally {
			setIsUploading(false);
		}
	}, [parsedRows, queryClient]);

	return (
		<div className="space-y-6">
			<h1 className="font-semibold text-2xl">Weekly Mosquito Activity</h1>

			{/* Upload Section */}
			<Card>
				<CardHeader>
					<CardTitle>Upload CSV Data</CardTitle>
					<CardDescription>
						Upload a CSV file with columns: species_name, species_group, year,
						week_number, mosquito_count, rainfall_inches. This will replace all
						existing data.
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
										Confirm &amp; Replace All Data
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
