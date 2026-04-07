import { notFoundImage } from "@mcmec/lib/constants/assets";
import { Button } from "@mcmec/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center gap-6 py-12">
			<img
				alt="Page not found"
				className="max-w-xs"
				loading="lazy"
				src={notFoundImage}
			/>
			<h1 className="font-bold text-2xl text-foreground">Page Not Found</h1>
			<p className="max-w-md text-center text-muted-foreground">
				The page you are looking for does not exist or has been moved.
			</p>
			<Button asChild>
				<Link to="/">
					<Home />
					Back to Home
				</Link>
			</Button>
		</div>
	);
}
