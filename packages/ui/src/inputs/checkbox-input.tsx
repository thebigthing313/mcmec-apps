"use client";

import { Checkbox } from "../components/checkbox";

interface CheckboxInputProps {
	id: string;
	name?: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
}

export function CheckboxInput({
	id,
	name,
	checked = false,
	onChange,
	disabled = false,
	className,
}: CheckboxInputProps) {
	return (
		<div className="flex items-center space-x-2">
			<Checkbox
				checked={checked}
				className={className}
				disabled={disabled}
				id={id}
				name={name}
				onCheckedChange={(checked) => onChange?.(checked === true)}
			/>
		</div>
	);
}
