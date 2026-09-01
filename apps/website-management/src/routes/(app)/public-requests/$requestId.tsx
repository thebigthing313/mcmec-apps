import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import type { RequestStatus } from "@mcmec/schemas/db/public-requests";
import { CopyButton } from "@mcmec/ui/blocks/copy-button";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { intents } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";
import {
	displayStatus,
	humanizeDetailKey,
	REQUEST_STATUS_LABELS,
	REQUEST_STATUS_VARIANTS,
	requestTypeLabel,
} from "@/src/lib/public-requests";

export const Route = createFileRoute("/(app)/public-requests/$requestId")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Request" };
	},
});

/**
 * `details` is per-type jsonb (the API's discriminated union owns its shape), so render it
 * generically: booleans become present/absent badges, everything else prints as text.
 */
function DetailsPanel({ details }: { details: unknown }) {
	if (!details || typeof details !== "object") return null;
	const entries = Object.entries(details as Record<string, unknown>);
	if (entries.length === 0) return null;

	const flags = entries.filter(([, v]) => typeof v === "boolean");
	const values = entries.filter(
		([, v]) => typeof v !== "boolean" && v !== null && v !== "",
	);

	// The whole group is one destination field, the way a message body is — a form on the other
	// system asks "what was reported," not one checkbox per flag. So the group gets one button
	// and the badges get none; a button per badge would be eight clicks to fill one box.
	const reported = flags
		.filter(([, value]) => value)
		.map(([key]) => humanizeDetailKey(key))
		.join(", ");

	return (
		<div className="space-y-4">
			{flags.length > 0 && (
				<div className="rounded-lg border p-4">
					<div className="mb-2 flex items-center gap-1">
						<h3 className="font-semibold">Reported</h3>
						<CopyButton label="reported details" text={reported} />
					</div>
					<div className="flex flex-wrap gap-2">
						{flags.map(([key, value]) => (
							<Badge key={key} variant={value ? "default" : "outline"}>
								{humanizeDetailKey(key)}
								{value ? "" : ": No"}
							</Badge>
						))}
					</div>
				</div>
			)}

			{values.map(([key, value]) => (
				<div className="rounded-lg border p-4" key={key}>
					<div className="mb-2 flex items-center gap-1">
						<h3 className="font-semibold">{humanizeDetailKey(key)}</h3>
						<CopyButton
							label={humanizeDetailKey(key).toLowerCase()}
							text={String(value)}
						/>
					</div>
					<p className="whitespace-pre-wrap">{String(value)}</p>
				</div>
			))}
		</div>
	);
}

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { db } = Route.useRouteContext();
	const { requestId } = Route.useParams();

	const { data: request } = useLiveQuery(
		(q) =>
			q
				.from({ r: db.publicRequests })
				.where(({ r }) => eq(r.id, requestId))
				.findOne(),
		[requestId],
	);

	const { data: zipCode } = useLiveQuery(
		(q) =>
			q
				.from({ zc: db.zipCodes })
				.where(({ zc }) => eq(zc.id, request?.zip_code_id ?? ""))
				.findOne(),
		[request?.zip_code_id],
	);

	if (!request) {
		return null;
	}

	const status = request.status as RequestStatus;

	// One button per legal transition, not a dropdown of states (ADR 0001). The dropdown this
	// replaces offered `in_progress` as a third equal choice, which `CONTEXT.md` rejects — a
	// request is either New or Resolved. So no command mints it, and the only thing that can be
	// done to a request that already holds it is resolve it.
	//
	// No form under this, so no `isDirty` and no relabel: a detail-view lifecycle button always
	// sends exactly one intent. The page stays put — the badge above is live, so the result of
	// the click shows where the click was.
	const triage =
		status === "resolved"
			? {
					icon: <RotateCcw />,
					label: "Reopen Request",
					onAct: () =>
						runLifecycle(db.publicRequests, requestId, {
							apply: (draft) => {
								draft.status = "new";
							},
							command: "website.reopenRequest",
							failure: "Failed to reopen the request.",
						}),
				}
			: {
					icon: <CheckCircle2 />,
					label: "Resolve Request",
					onAct: () =>
						runLifecycle(db.publicRequests, requestId, {
							apply: (draft) => {
								draft.status = "resolved";
							},
							command: "website.resolveRequest",
							failure: "Failed to resolve the request.",
						}),
				};

	// Delete is the one action whose placement is not free — detail page only, danger zone,
	// behind a confirm (ADR 0001). It leaves the page because the record it was showing is gone.
	const handleDelete = () => {
		const tx = db.publicRequests.delete(
			requestId,
			intents("website.deleteRequest"),
		);
		toastOnError(tx, "Failed to delete the request.");
		navigate({ to: "/public-requests" });
	};

	return (
		<RecordDetail
			actions={
				<LifecycleButton
					icon={triage.icon}
					label={triage.label}
					onAct={triage.onAct}
					size="sm"
				/>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/public-requests">
						<ArrowLeft />
						Back to Public Requests
					</Link>
				</Button>
			}
			badge={
				<Badge variant={REQUEST_STATUS_VARIANTS[displayStatus(status)]}>
					{REQUEST_STATUS_LABELS[displayStatus(status)]}
				</Badge>
			}
			danger={
				<DangerZoneCard
					description={`This permanently removes ${request.name}'s ${requestTypeLabel(request.request_type).toLowerCase()} request, including their contact details. This cannot be undone.`}
					label="Delete Request"
					onConfirm={handleDelete}
					recordName={request.name}
				/>
			}
			// One row is one copyable value. The address used to join its two lines with ", " and
			// the zip code read "<code> — <city>, <state>"; both are composed for reading and wrong
			// for a clipboard, and a button that quietly copied something other than the words
			// beside it would be worse than no button. Splitting them means what is displayed and
			// what is copied are the same string. "Submitted" carries no button — a formatted date
			// is not re-keyed into anything.
			fields={[
				{
					copyText: request.phone ?? "",
					label: "Phone",
					value: request.phone || "Not given",
				},
				{
					copyText: request.email ?? "",
					label: "Email",
					value: request.email || "Not given",
				},
				{ label: "Submitted", value: formatDateShort(request.created_at) },
				...(request.address_line_1
					? [
							{
								copyText: request.address_line_1,
								label: "Address line 1",
								value: request.address_line_1,
							},
							{
								copyText: request.address_line_2 ?? "",
								label: "Address line 2",
								value: request.address_line_2 || "Not given",
							},
						]
					: []),
				...(request.zip_code_id
					? [
							{
								copyText: zipCode?.code ?? "",
								label: "Zip code",
								value: zipCode?.code ?? "Unknown",
							},
							{
								copyText: zipCode?.city ?? "",
								label: "City",
								value: zipCode?.city ?? "Unknown",
							},
							{
								copyText: zipCode?.state ?? "",
								label: "State",
								value: zipCode?.state ?? "Unknown",
							},
						]
					: []),
			]}
			// The person leads, not the category. The dashboard's aging queue already names the
			// resident and puts their address beneath — and then the page it links to titled itself
			// "Water Management" and demoted the person to a grey sub-label.
			subtitle={requestTypeLabel(request.request_type)}
			title={request.name}
			titleCopyText={request.name}
		>
			<DetailsPanel details={request.details} />
		</RecordDetail>
	);
}
