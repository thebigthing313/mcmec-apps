import {
	InputGroup,
	InputGroupAddon,
	InputGroupTextarea,
} from "../components/input-group";

interface TextAreaInputProps {
	className?: string;
}

export function TextAreaInput({
	className,
	ref,
	...props
}: TextAreaInputProps & React.ComponentPropsWithRef<"textarea">) {
	return (
		<InputGroup className={className}>
			<InputGroupTextarea ref={ref} {...props} />
			<InputGroupAddon align="inline-end"></InputGroupAddon>
		</InputGroup>
	);
}
