import { formatDate } from "@mcmec/lib/functions/date-fns";
import { Badge } from "@mcmec/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import { ExternalLink, MapPin } from "lucide-react";

interface SprayScheduleCardProps {
	missionDate: Date;
	startTime: string;
	endTime: string;
	rainDate: Date | null;
	status: string;
	municipalities: string;
	areaDescription: string;
	insecticideName: string;
	insecticideLabelUrl: string | null;
	insecticideMsdsUrl: string | null;
	mapUrl: string | null;
}

function getStatusBadgeVariant(
	status: string,
): "default" | "secondary" | "outline" | "destructive" {
	switch (status) {
		case "scheduled":
			return "default";
		case "delayed":
			return "outline";
		case "cancelled":
			return "destructive";
		case "completed":
			return "secondary";
		default:
			return "outline";
	}
}

function formatTimeDisplay(time: string): string {
	const parts = time.split(":");
	const h = Number.parseInt(parts[0] ?? "0", 10);
	const ampm = h >= 12 ? "PM" : "AM";
	const h12 = h % 12 || 12;
	return `${h12}:${parts[1] ?? "00"} ${ampm}`;
}

export function SprayScheduleCard({
	missionDate,
	startTime,
	endTime,
	rainDate,
	status,
	municipalities,
	areaDescription,
	insecticideName,
	insecticideLabelUrl,
	insecticideMsdsUrl,
	mapUrl,
}: SprayScheduleCardProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<div>
						<CardTitle className="text-xl">{formatDate(missionDate)}</CardTitle>
						<CardDescription className="text-base">
							{formatTimeDisplay(startTime)} – {formatTimeDisplay(endTime)}
						</CardDescription>
					</div>
					<Badge variant={getStatusBadgeVariant(status)}>
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<dl className="grid gap-3 text-sm">
					<div className="flex items-start gap-2">
						<dt className="min-w-32 font-semibold text-muted-foreground">
							Municipalities
						</dt>
						<dd>{municipalities}</dd>
					</div>
					<div className="flex items-start gap-2">
						<dt className="min-w-32 font-semibold text-muted-foreground">
							Area
						</dt>
						<dd>{areaDescription}</dd>
					</div>
					<div className="flex items-start gap-2">
						<dt className="min-w-32 font-semibold text-muted-foreground">
							Insecticide
						</dt>
						<dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
							<span>{insecticideName}</span>
							{insecticideLabelUrl && (
								<a
									className="inline-flex items-center gap-1 text-primary text-xs underline hover:no-underline"
									href={insecticideLabelUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									Label
									<ExternalLink className="h-3 w-3" />
								</a>
							)}
							{insecticideMsdsUrl && (
								<a
									className="inline-flex items-center gap-1 text-primary text-xs underline hover:no-underline"
									href={insecticideMsdsUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									SDS
									<ExternalLink className="h-3 w-3" />
								</a>
							)}
						</dd>
					</div>
					{rainDate && (
						<div className="flex items-start gap-2">
							<dt className="min-w-32 font-semibold text-muted-foreground">
								Rain Date
							</dt>
							<dd>{formatDate(rainDate)}</dd>
						</div>
					)}
					{mapUrl && (
						<div className="flex items-start gap-2">
							<dt className="min-w-32 font-semibold text-muted-foreground">
								Map
							</dt>
							<dd>
								<a
									className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
									href={mapUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									<MapPin className="h-4 w-4" />
									View Spray Area Map
									<ExternalLink className="h-3 w-3" />
								</a>
							</dd>
						</div>
					)}
				</dl>
			</CardContent>
		</Card>
	);
}
