import { Badge } from "../components/badge";

interface PublicNoticeBadgeProps {
	isPublished: boolean;
	isArchived: boolean;
	noticeDate: Date;
}

export function PublicNoticeBadge({
	isPublished,
	isArchived,
	noticeDate,
}: PublicNoticeBadgeProps) {
	const now = new Date();
	const isPending = noticeDate > now;
	const status = isPublished
		? isArchived
			? "Archived"
			: isPending
				? "Pending"
				: "Published"
		: "Draft";

	return (
		<Badge
			variant={
				status === "Published"
					? "default"
					: status === "Pending"
						? "default"
						: status === "Archived"
							? "secondary"
							: "outline"
			}
		>
			{status}
		</Badge>
	);
}
