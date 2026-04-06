"use client";

import { InputGroup, InputGroupInput } from "../components/input-group";

interface TimeInputProps {
	className?: string;
}

export function TimeInput({
	className,
	ref,
	...props
}: TimeInputProps & React.ComponentPropsWithRef<"input">) {
	return (
		<InputGroup className={className}>
			<InputGroupInput ref={ref} type="time" {...props} />
		</InputGroup>
	);
}
