"use client";

import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { Calendar } from "../components/calendar";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";

interface DateInputProps {
	value?: Date;
	onChange?: (date: Date | undefined) => void;
	disabled?: boolean;
	className?: string;
	required?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}
export function DateInput({
	className,
	value,
	onChange,
	disabled,
	required,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: DateInputProps &
	Omit<
		React.ComponentPropsWithRef<"input">,
		| "value"
		| "onChange"
		| "disabled"
		| "required"
		| "aria-label"
		| "aria-labelledby"
	>) {
	const [open, setOpen] = React.useState(false);
	const [isInvalid, setIsInvalid] = React.useState(false);
	const [inputValue, setInputValue] = React.useState("");

	React.useEffect(() => {
		setInputValue(value && isValid(value) ? format(value, "yyyy-MM-dd") : "");
	}, [value]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let newValue = e.target.value;
		// Allow typing digits and -
		newValue = newValue.replace(/[^0-9-]/g, "");
		// Apply mask: YYYY-MM-DD
		const digits = newValue.replace(/\D/g, "");
		let masked = digits;
		if (digits.length >= 5) {
			masked =
				digits.slice(0, 4) +
				"-" +
				digits.slice(4, 6) +
				"-" +
				digits.slice(6, 8);
		} else if (digits.length >= 3) {
			masked = `${digits.slice(0, 4)}-${digits.slice(4)}`;
		}
		setInputValue(masked);
	};

	const handleBlur = () => {
		if (inputValue === "") {
			onChange?.(undefined);
			setIsInvalid(false);
		} else {
			const parsed = parse(inputValue, "yyyy-MM-dd", new Date());
			if (isValid(parsed)) {
				onChange?.(parsed);
				setIsInvalid(false);
			} else {
				setIsInvalid(true);
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setOpen(false);
		}
	};

	return (
		<InputGroup className={className} onKeyDown={handleKeyDown}>
			<InputGroupInput
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onBlur={handleBlur}
				placeholder="YYYY-MM-DD"
				disabled={disabled}
				required={required}
				aria-label={ariaLabel || "Date input"}
				aria-labelledby={ariaLabelledBy}
				aria-invalid={isInvalid}
			/>
			<InputGroupAddon align="inline-end">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<InputGroupButton
							variant="ghost"
							size="icon-sm"
							aria-label="Open date picker"
							aria-expanded={open}
							disabled={disabled}
						>
							<CalendarIcon />
						</InputGroupButton>
					</PopoverTrigger>
					<PopoverContent>
						<Calendar
							mode="single"
							selected={value}
							captionLayout="dropdown"
							onSelect={(date) => {
								onChange?.(date);
								setInputValue(
									date && isValid(date) ? format(date, "yyyy-MM-dd") : "",
								);
								setIsInvalid(false);
								setOpen(false);
							}}
						/>
					</PopoverContent>
				</Popover>
			</InputGroupAddon>
		</InputGroup>
	);
}
