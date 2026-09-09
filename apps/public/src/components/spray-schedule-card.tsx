import {
	formatClockTime,
	formatDateWithWeekday,
} from "@mcmec/lib/functions/date-fns";
import { Badge } from "@mcmec/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import { ExternalLink, MapPin } from "lucide-react";

/*
 * Every mission on this schedule is applied the same way, so the method is a constant rather
 * than a stored field. If the Commission ever sprays by another method, this moves to the
 * mission record — the card already reads it as one line either way.
 */
const SPRAY_METHOD = "Ultralow Volume Spraying by Truck";

/*
 * TEMPORARY — issue #220. Insecticides carry a label and an SDS URL and nothing else, so the one
 * fact sheet we have to publish is matched by trade name here rather than stored. It comes out
 * the moment `insecticides` grows a `fact_sheet_url` column and this becomes a third URL like
 * the others.
 */
const FACT_SHEET_URLS: Record<string, string> = {
	zenivex:
		"https://middlesexmosquito.sharepoint.com/:b:/g/IQA8WAM64HkzSYZ8dAej33eKAQFheJOEA3HntjhHQMKkLSE?e=62lpBx",
};

function factSheetUrl(insecticideName: string): string | undefined {
	const key = Object.keys(FACT_SHEET_URLS).find((name) =>
		insecticideName.toLowerCase().includes(name),
	);
	return key ? FACT_SHEET_URLS[key] : undefined;
}

interface SprayScheduleCardProps {
	insecticideActiveIngredient: string;
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

/*
 * The status is the word, not the colour.
 *
 * Cancelled used to take the destructive red. Red is the system's refusal colour and it was
 * being asked to carry urgency here, which the design system rules out — and it read as bad
 * news, when a cancelled spray is neutral or welcome for most of the people looking at it.
 * Cancelled and delayed both take the quiet outline variant now, and every status is told
 * apart by what it says. Scheduled keeps the filled green — it is the one the page exists
 * to announce.
 */
function getStatusBadgeVariant(
	status: string,
): "default" | "secondary" | "outline" {
	switch (status) {
		case "scheduled":
			return "default";
		case "completed":
			return "secondary";
		default:
			return "outline";
	}
}

export function SprayScheduleCard({
	insecticideActiveIngredient,
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
	const insecticideFactSheetUrl = factSheetUrl(insecticideName);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<div>
						<CardTitle className="text-xl">
							{formatDateWithWeekday(missionDate)}
						</CardTitle>
						<CardDescription className="text-base">
							{formatClockTime(startTime)} – {formatClockTime(endTime)}
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
							<span>
								{insecticideName}
								{insecticideActiveIngredient
									? ` (${insecticideActiveIngredient})`
									: ""}
							</span>
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
							{insecticideFactSheetUrl && (
								<a
									className="inline-flex items-center gap-1 text-primary text-xs underline hover:no-underline"
									href={insecticideFactSheetUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									Fact Sheet
									<ExternalLink className="h-3 w-3" />
								</a>
							)}
						</dd>
					</div>
					<div className="flex items-start gap-2">
						<dt className="min-w-32 font-semibold text-muted-foreground">
							Method
						</dt>
						<dd>{SPRAY_METHOD}</dd>
					</div>
					{rainDate && (
						<div className="flex items-start gap-2">
							<dt className="min-w-32 font-semibold text-muted-foreground">
								Rain Date
							</dt>
							<dd>{formatDateWithWeekday(rainDate)}</dd>
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
