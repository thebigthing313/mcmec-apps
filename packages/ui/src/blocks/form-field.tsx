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
	/**
	 * Mark the field required, in the label and on the control.
	 *
	 * Callers used to type the marker into the label themselves — `label="Full Name *"` —
	 * which put a bare asterisk in the accessible name, so the field announced as "Full
	 * Name star". The asterisk is drawn here instead and hidden from assistive technology,
	 * with the word "(required)" carried in a screen-reader-only span beside it. Fields
	 * pass the same flag to their input as `aria-required`.
	 */
	required?: boolean;
}

/** The visible marker and its spoken equivalent. */
function RequiredMarker() {
	return (
		<>
			<span aria-hidden="true" className="text-destructive">
				{" *"}
			</span>
			<span className="sr-only">(required)</span>
		</>
	);
}

export function FormField({
	label,
	description,
	htmlFor,
	className,
	children,
	ref,
	errors,
	required,
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
						{required && <RequiredMarker />}
					</FieldLabel>
					<FieldDescription>{description}</FieldDescription>
				</FieldContent>
			) : (
				<>
					{label && (
						<FieldLabel className="text-md" htmlFor={htmlFor}>
							{label}
							{required && <RequiredMarker />}
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
