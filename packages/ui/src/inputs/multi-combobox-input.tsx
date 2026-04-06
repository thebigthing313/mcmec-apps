"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../components/command";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/utils";

export interface MultiComboboxOption {
	value: string;
	label: string;
}

interface MultiComboboxInputProps {
	options: MultiComboboxOption[];
	value?: string[];
	onChange?: (value: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	className?: string;
	disabled?: boolean;
}

export function MultiComboboxInput({
	options,
	value = [],
	onChange,
	placeholder = "Select options...",
	searchPlaceholder = "Search...",
	emptyMessage = "No option found.",
	className,
	disabled = false,
}: MultiComboboxInputProps) {
	const [open, setOpen] = React.useState(false);

	const selectedLabels = value
		.map((v) => options.find((o) => o.value === v)?.label)
		.filter(Boolean);

	function handleToggle(optionValue: string) {
		const next = value.includes(optionValue)
			? value.filter((v) => v !== optionValue)
			: [...value, optionValue];
		onChange?.(next);
	}

	function handleRemove(optionValue: string) {
		onChange?.(value.filter((v) => v !== optionValue));
	}

	return (
		<div className="flex flex-col gap-2">
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						aria-expanded={open}
						className={cn("w-full justify-between", className)}
						disabled={disabled}
						role="combobox"
						variant="outline"
					>
						{value.length > 0 ? `${value.length} selected` : placeholder}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-full p-0">
					<Command>
						<CommandInput className="h-9" placeholder={searchPlaceholder} />
						<CommandList>
							<CommandEmpty>{emptyMessage}</CommandEmpty>
							<CommandGroup>
								{options.map((option) => (
									<CommandItem
										key={option.value}
										onSelect={() => handleToggle(option.value)}
										value={option.value}
									>
										{option.label}
										<Check
											className={cn(
												"ml-auto h-4 w-4",
												value.includes(option.value)
													? "opacity-100"
													: "opacity-0",
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selectedLabels.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{value.map((v) => {
						const label = options.find((o) => o.value === v)?.label;
						return (
							<Badge key={v} variant="secondary">
								{label}
								<button
									aria-label={`Remove ${label}`}
									className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
									onClick={() => handleRemove(v)}
									type="button"
								>
									<X className="h-3 w-3" />
								</button>
							</Badge>
						);
					})}
				</div>
			)}
		</div>
	);
}
