import { Button } from "../components/button";

interface NotFoundProps {
	onAction: () => void;
	message?: string;
}

export function NotFound({
	onAction,
	message = "The resource you are looking for could not be found.",
}: NotFoundProps) {
	return (
		<div className="flex min-h-100 flex-col items-center justify-center p-6 text-center">
			<img
				alt="404 Not Found"
				className="mb-6 h-64 w-64"
				src="/shared/404-not-found.png"
			/>
			<h2 className="mb-4 font-semibold text-2xl">Not Found</h2>
			<p className="mb-6 max-w-md text-muted-foreground">{message}</p>
			<Button onClick={onAction}>Go Back</Button>
		</div>
	);
}
