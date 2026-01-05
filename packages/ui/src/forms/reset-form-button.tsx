import { toast } from "sonner";
import { Button } from "../components/button";
import { useFormContext } from "./form-context";

interface ResetFormButtonProps {
	label?: string;
}
export function ResetFormButton({
	label = "Reset",
	ref,
	...props
}: ResetFormButtonProps & React.ComponentPropsWithRef<"button">) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button
					ref={ref}
					type="button"
					variant="secondary"
					aria-busy={isSubmitting}
					disabled={isSubmitting}
					onClick={() => {
						form.reset();
						toast.success("Form reset to original values.");
					}}
					{...props}
				>
					{label}
				</Button>
			)}
		</form.Subscribe>
	);
}
