import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "../components/command";
import { Input } from "../components/input";
import { Popover, PopoverAnchor, PopoverContent } from "../components/popover";
import { Skeleton } from "../components/skeleton";
import { cn } from "../lib/utils";

type Props<T extends string> = {
	selectedValue: T;
	onSelectedValueChange: (value: T) => void;
	searchValue: string;
	onSearchValueChange: (value: string) => void;
	items: { value: T; label: string }[];
	isLoading?: boolean;
	emptyMessage?: string;
	placeholder?: string;
};

export function AutoComplete<T extends string>({
	selectedValue,
	onSelectedValueChange,
	searchValue,
	onSearchValueChange,
	items,
	isLoading,
	emptyMessage = "No items.",
	placeholder = "Search...",
}: Props<T>) {
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const labels = useMemo(
		() =>
			items.reduce(
				(acc, item) => {
					acc[item.value] = item.label;
					return acc;
				},
				{} as Record<string, string>,
			),
		[items],
	);

	const reset = () => {
		onSelectedValueChange("" as T);
		onSearchValueChange("");
	};

	const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		if (!e.relatedTarget?.hasAttribute("cmdk-list")) {
			// Get the actual DOM value in case browser autofill bypassed React state
			const actualValue = inputRef.current?.value || searchValue;

			// Check if actualValue matches any label (handle browser autofill)
			if (actualValue && labels[selectedValue] !== actualValue) {
				const matchingItem = items.find(
					(item) => item.label === actualValue || item.value === actualValue,
				);
				if (matchingItem) {
					// Auto-select the matching item
					onSelectItem(matchingItem.value);
				} else {
					// No match found, reset
					reset();
				}
			}
		}
	};

	const onSelectItem = (inputValue: string) => {
		if (inputValue === selectedValue) {
			reset();
		} else {
			onSelectedValueChange(inputValue as T);
			onSearchValueChange(labels[inputValue] ?? "");
		}
		setOpen(false);
	};

	return (
		<div className="flex items-center">
			<Popover onOpenChange={setOpen} open={open}>
				<Command shouldFilter={false}>
					<PopoverAnchor asChild>
						<CommandPrimitive.Input
							asChild
							onBlur={onInputBlur}
							onFocus={() => setOpen(true)}
							onKeyDown={(e) => setOpen(e.key !== "Escape")}
							onMouseDown={() => setOpen((open) => !!searchValue || !open)}
							onValueChange={onSearchValueChange}
							value={searchValue}
						>
							<Input placeholder={placeholder} ref={inputRef} />
						</CommandPrimitive.Input>
					</PopoverAnchor>
					{!open && <CommandList aria-hidden="true" className="hidden" />}
					<PopoverContent
						asChild
						className="w-[--radix-popover-trigger-width] p-0"
						onInteractOutside={(e) => {
							if (
								e.target instanceof Element &&
								e.target.hasAttribute("cmdk-input")
							) {
								e.preventDefault();
							}
						}}
						onOpenAutoFocus={(e) => e.preventDefault()}
					>
						<CommandList>
							{isLoading && (
								<CommandPrimitive.Loading>
									<div className="p-1">
										<Skeleton className="h-6 w-full" />
									</div>
								</CommandPrimitive.Loading>
							)}
							{items.length > 0 && !isLoading ? (
								<CommandGroup>
									{items.map((option) => (
										<CommandItem
											key={option.value}
											onMouseDown={(e) => e.preventDefault()}
											onSelect={onSelectItem}
											value={option.value}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													selectedValue === option.value
														? "opacity-100"
														: "opacity-0",
												)}
											/>
											{option.label}
										</CommandItem>
									))}
								</CommandGroup>
							) : null}
							{!isLoading ? (
								<CommandEmpty>{emptyMessage ?? "No items."}</CommandEmpty>
							) : null}
						</CommandList>
					</PopoverContent>
				</Command>
			</Popover>
		</div>
	);
}
