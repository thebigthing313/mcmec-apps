import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@mcmec/ui/components/popover";
import { cn } from "@mcmec/ui/lib/utils";
import type { ComponentProps } from "react";
import type { CalendarItem } from "@/src/lib/calendar/items";
import { itemAccessibleName } from "@/src/lib/calendar/labels";
import { ItemDetails } from "./parts";

/**
 * One Calendar item as a button that opens its details.
 *
 * The button's name is the item's whole description — source, title, date and status — so what
 * the colour and the strike say visually is said in words too. Radix's popover takes focus in,
 * closes on Escape and hands focus back to the button.
 */
export function ItemPopover({
	item,
	className,
	children,
	...props
}: { item: CalendarItem } & Omit<ComponentProps<"button">, "type">) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					aria-label={itemAccessibleName(item)}
					className={cn(
						"text-left focus-visible:z-20 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
						className,
					)}
					type="button"
					{...props}
				>
					{children}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<ItemDetails item={item} />
			</PopoverContent>
		</Popover>
	);
}
