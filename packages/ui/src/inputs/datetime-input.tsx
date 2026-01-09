"use client";

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

function formatDate(date: Date | undefined) {
	if (!date) {
		return "";
	}
	return date.toLocaleDateString("en-US", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function formatTime(date: Date | undefined) {
	if (!date) {
		return "00:00:00";
	}
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const seconds = date.getSeconds().toString().padStart(2, "0");
	return `${hours}:${minutes}:${seconds}`;
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

		const [hours = "0", minutes = "0", seconds = "0"] = timeValue.split(":");
		const newDate = value ? new Date(value) : new Date();

		newDate.setHours(Number.parseInt(hours, 10));
		newDate.setMinutes(Number.parseInt(minutes, 10));
		newDate.setSeconds(Number.parseInt(seconds, 10));

		onChange?.(newDate);
	};

	return (
		<div className={cn("flex gap-2", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						disabled={disabled}
						className={cn(
							"justify-between font-normal",
							showTimeInput ? "flex-1" : "w-full",
							!value && "text-muted-foreground",
						)}
					>
						{value ? formatDate(value) : placeholder}
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto overflow-hidden p-0" align="start">
					<Calendar
						mode="single"
						selected={value}
						onSelect={handleDateSelect}
						captionLayout="dropdown"
						month={month}
						onMonthChange={setMonth}
						disabled={disabled}
					/>
				</PopoverContent>
			</Popover>
			{showTimeInput && (
				<Input
					type="time"
					step="1"
					value={formatTime(value)}
					onChange={handleTimeChange}
					disabled={disabled}
					className="w-35 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			)}
		</div>
	);
}
