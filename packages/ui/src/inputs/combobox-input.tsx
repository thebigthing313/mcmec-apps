"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
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

export interface ComboboxOption {
	value: string;
	label: string;
}

interface ComboboxInputProps {
	options: ComboboxOption[];
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	className?: string;
	disabled?: boolean;
}

export function ComboboxInput({
	options,
	value,
	onChange,
	placeholder = "Select option...",
	searchPlaceholder = "Search...",
	emptyMessage = "No option found.",
	className,
	disabled = false,
}: ComboboxInputProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
					disabled={disabled}
					role="combobox"
					variant="outline"
				>
					{value
						? options.find((option) => option.value === value)?.label
						: placeholder}
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
									// Same fix as `MultiComboboxInput`, and for the same reason:
									// the item's `value` is the id, so cmdk filtered the search box
									// against a list of uuids and emptied the popover. `keywords` is
									// a separate argument to cmdk's filter — it never reaches
									// `onSelect`, which still receives the resolved value, i.e. the
									// id this list is keyed and selected by.
									key={option.value}
									keywords={[option.label]}
									onSelect={(currentValue) => {
										onChange?.(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
									value={option.value}
								>
									{option.label}
									<Check
										className={cn(
											"ml-auto h-4 w-4",
											value === option.value ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
