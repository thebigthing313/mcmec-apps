import type { ContactFormSubmissionsRowType } from "@mcmec/supabase/db/contact-form-submissions";
import { createFileRoute } from "@tanstack/react-router";
import { ContactSubmissionForm } from "@/src/components/contact-submission-form";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/contact-submissions/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create New Submission" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { db } = Route.useRouteContext();

	const handleSubmit = async (value: ContactFormSubmissionsRowType) => {
		const tx = db.contactFormSubmissions.insert(value);
		toastOnError(tx, "Failed to create submission.");
		navigate({ to: "/contact-submissions" });
	};

	return (
		<ContactSubmissionForm
			defaultValues={{
				created_at: new Date(),
				created_by: null,
				email: "",
				id: crypto.randomUUID(),
				is_closed: false,
				message: "",
				name: "",
				subject: "",
				updated_at: new Date(),
				updated_by: null,
			}}
			formLabel="Create New Contact Submission"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
