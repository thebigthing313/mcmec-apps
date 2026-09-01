import { FieldDescription, FieldLegend, FieldSet } from "../components/field";
import { useFormContext } from "./form-context";

interface FormWrapperProps {
	/**
	 * The fieldset's legend. Omit it when the screen already names the form in its `PageHeader`
	 * `h1` — the edit routes do — so the same words are not rendered, and announced, twice.
	 */
	formLabel?: string;
	formDescription?: string;
	className?: string;
}
export function FormWrapper({
	formLabel,
	formDescription,
	className,
	children,
}: Omit<React.ComponentPropsWithoutRef<"form">, "className" | "onSubmit"> &
	FormWrapperProps) {
	const form = useFormContext();
	return (
		<div className={className}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<FieldSet>
					{formLabel && <FieldLegend>{formLabel}</FieldLegend>}
					{formDescription && (
						<FieldDescription>{formDescription}</FieldDescription>
					)}
					{children}
				</FieldSet>
			</form>
		</div>
	);
}
