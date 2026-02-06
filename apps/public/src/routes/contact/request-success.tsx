import { Button } from "@mcmec/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/contact/request-success")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	return (
		<div className="flex flex-col gap-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Request Submitted Successfully!</h1>
				<p>
					Thank you for submitting your request. Your request has been forwarded
					to the local inspector. If applicable, please notify the other members
					of your household that a Mosquito Commission inspector is expected to
					arrive within a few business days. If an inspector visits while you
					are not home, they will leave a report by the door documenting any
					actions they may have taken. Feel free to contact our office if you
					have any questions or need further assistance.
				</p>
			</article>
			<Button
				className="mt-4"
				onClick={() => navigate({ to: "/" })}
				variant="default"
			>
				<ChevronLeft /> Back to Home
			</Button>
		</div>
	);
}
