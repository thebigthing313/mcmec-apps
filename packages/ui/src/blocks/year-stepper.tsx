import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/button";

/**
 * ‹ 2026 › — one year at a time, with no bounds.
 *
 * For a screen that reads a year at a time (Holidays, in HR and on the Portal). Unbounded on
 * purpose: next year's Holidays are entered before it starts, and an old year is still a record.
 * The year is announced as it changes, so a screen-reader user hears where the buttons took them.
 */
export function YearStepper({
	year,
	onYearChange,
	label = "Year",
}: {
	year: number;
	onYearChange: (year: number) => void;
	/** What the year is a year of, for the buttons' names — "Previous year" by default. */
	label?: string;
}) {
	return (
		<fieldset className="flex items-center gap-1">
			<legend className="sr-only">{label}</legend>
			<Button
				aria-label={`Previous ${label.toLowerCase()}, ${year - 1}`}
				onClick={() => onYearChange(year - 1)}
				size="icon"
				type="button"
				variant="outline"
			>
				<ChevronLeft />
			</Button>
			<output
				aria-live="polite"
				className="min-w-14 text-center font-semibold tabular-nums"
			>
				{year}
			</output>
			<Button
				aria-label={`Next ${label.toLowerCase()}, ${year + 1}`}
				onClick={() => onYearChange(year + 1)}
				size="icon"
				type="button"
				variant="outline"
			>
				<ChevronRight />
			</Button>
		</fieldset>
	);
}
