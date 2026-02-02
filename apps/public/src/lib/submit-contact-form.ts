import { ContactFormSubmissionsInsertSchema } from "@mcmec/supabase/db/contact-form-submissions";
import { createServerFn } from "@tanstack/react-start";

export const submitContactFormServerFn = createServerFn({ method: "POST" })
	.inputValidator(ContactFormSubmissionsInsertSchema)
	.handler(async ({ data }) => {
		console.log("Received contact form submission:", data);
	});
