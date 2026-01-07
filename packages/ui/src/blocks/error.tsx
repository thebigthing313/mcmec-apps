import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { Button } from "../components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/card";

interface ErrorProps {
	message: string;
	details?: string;
	errorCode?: string;
	onRetry?: () => void;
	onBack?: () => void;
	showDetails?: boolean;
}

export function ErrorDisplay({
	message,
	details,
	errorCode,
	onRetry,
	onBack,
	showDetails = false,
}: ErrorProps) {
	return (
		<div className="flex min-h-100 items-center justify-center p-6">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="flex-1">
							<CardTitle>Sorry about that!</CardTitle>
							{errorCode && (
								<CardDescription>Error Code: {errorCode}</CardDescription>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<Alert variant="destructive">
						<AlertCircle />
						<AlertTitle>An Error Has Occurred</AlertTitle>
						<AlertDescription>{message}</AlertDescription>
					</Alert>

					{showDetails && details && (
						<div className="rounded-md bg-muted p-4">
							<h4 className="mb-2 font-medium text-sm">Details:</h4>
							<pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
								{details}
							</pre>
						</div>
					)}

					<div className="flex gap-2">
						{onRetry && (
							<Button onClick={onRetry} className="flex-1">
								Try Again
							</Button>
						)}
						{onBack && (
							<Button onClick={onBack} variant="outline" className="flex-1">
								Go Back
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
