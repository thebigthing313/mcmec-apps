import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "../components/field";

interface FormFieldProps {
	label?: string;
	description?: string;
	htmlFor?: string;
	orientation?: "horizontal" | "vertical";
	errors?: Array<{ message?: string | undefined } | undefined>;
}

export function FormField({
	label,
	description,
	htmlFor,
	className,
	children,
	ref,
	errors,
	...props
}: FormFieldProps & React.ComponentPropsWithRef<"div">) {
	return (
		<Field
			className={className}
			orientation={props.orientation}
			ref={ref}
			{...props}
		>
			{label && description ? (
				<FieldContent>
					<FieldLabel className="text-md" htmlFor={htmlFor}>
						{label}
					</FieldLabel>
					<FieldDescription>{description}</FieldDescription>
				</FieldContent>
			) : (
				<>
					{label && (
						<FieldLabel className="text-md" htmlFor={htmlFor}>
							{label}
						</FieldLabel>
					)}
					{description && <FieldDescription>{description}</FieldDescription>}
				</>
			)}
			{children}
			<FieldError errors={errors} />
		</Field>
	);
}
