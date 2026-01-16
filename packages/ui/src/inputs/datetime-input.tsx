"use client";

import {
	formatDate,
	formatTime,
	parseTimeToDate,
} from "@mcmec/lib/functions/date-fns";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Button } from "../components/button";
import { Calendar } from "../components/calendar";
import { Input } from "../components/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/utils";

interface DateTimeInputProps {
	value?: Date;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	showTimeInput?: boolean;
}

export function DateTimeInput({
	value,
	onChange,
	placeholder = "Select date",
	className,
	disabled = false,
	showTimeInput = false,
}: DateTimeInputProps) {
	const [open, setOpen] = React.useState(false);
	const [month, setMonth] = React.useState<Date | undefined>(value);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) {
			onChange?.(undefined);
			return;
		}

		// If we have an existing value with time, preserve the time
		if (value && showTimeInput) {
			const newDate = new Date(selectedDate);
			newDate.setHours(value.getHours());
			newDate.setMinutes(value.getMinutes());
			newDate.setSeconds(value.getSeconds());
			onChange?.(newDate);
		} else {
			onChange?.(selectedDate);
		}
		setOpen(false);
	};

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const timeValue = e.target.value; // HH:MM:SS or HH:MM
		if (!timeValue) return;

		const newDate = parseTimeToDate(value, timeValue);
		onChange?.(newDate);
	};

	return (
		<div className={cn("flex gap-2", className)}>
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						className={cn(
							"justify-between font-normal",
							showTimeInput ? "flex-1" : "w-full",
							!value && "text-muted-foreground",
						)}
						disabled={disabled}
						variant="outline"
					>
						{value ? formatDate(value) : placeholder}
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-auto overflow-hidden p-0">
					<Calendar
						captionLayout="dropdown"
						disabled={disabled}
						mode="single"
						month={month}
						onMonthChange={setMonth}
						onSelect={handleDateSelect}
						selected={value}
					/>
				</PopoverContent>
			</Popover>
			{showTimeInput && (
				<Input
					className="w-35 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
					disabled={disabled}
					onChange={handleTimeChange}
					step="1"
					type="time"
					value={formatTime(value)}
				/>
			)}
		</div>
	);
}
