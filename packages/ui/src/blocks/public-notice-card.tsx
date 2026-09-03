"use client";

import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import type { JSONContent } from "@tiptap/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/card";
import { PublicNoticeBadge } from "./public-notice-badge";
import { ShareNoticeDialog } from "./share-notice-dialog";
import { TiptapRenderer } from "./tiptap-renderer";

interface PublicNoticeCardProps {
	title: string;
	type: string;
	content: string | JSONContent | null;
	noticeDate: Date;
	isPublished: boolean;
	isArchived: boolean;
	className?: string;
	showShare?: boolean;
	onNoticeClick?: () => void;
	getShareUrl?: () => string;
}
export function PublicNoticeCard({
	title,
	type,
	content,
	noticeDate,
	isPublished,
	isArchived,
	className,
	onNoticeClick,
	getShareUrl,
	showShare = true,
}: PublicNoticeCardProps) {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	// Get share URL from callback or fallback to current URL
	const shareUrl =
		getShareUrl?.() ||
		(typeof window !== "undefined" ? window.location.href : "");

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			toast.success("Link copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
			toast.error(ErrorMessages.UI.FAILED_TO_COPY);
		}
	};

	return (
		<Card className={className}>
			<CardHeader className="border-b">
				{/*
				 * The title looked clickable and was not reachable. It carried `cursor-pointer`,
				 * a hover underline and an onClick on a plain div — no focus, no Enter, nothing
				 * for a screen reader to announce as an action. A button gets all of that for
				 * free and keeps the styling; where there is nothing to click it stays text.
				 */}
				<CardTitle className="text-xl">
					{onNoticeClick ? (
						<button
							className="cursor-pointer text-left hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
							onClick={onNoticeClick}
							type="button"
						>
							{title}
						</button>
					) : (
						title
					)}
				</CardTitle>
				{showShare && (
					<CardAction>
						<ShareNoticeDialog
							copied={copied}
							handleCopy={handleCopy}
							open={open}
							setOpen={setOpen}
							shareUrl={shareUrl}
						/>
					</CardAction>
				)}
				{/*
				 * "Notice date", not "Published on". The value is the notice's own legal date
				 * from `notice_date`, which is not the day it went up on the site, and
				 * labelling it as a publication date misstates the record. The old fallback
				 * printed a literal "[unknown]" to the public; a notice with no date now shows
				 * nothing rather than a placeholder.
				 */}
				{noticeDate && (
					<CardDescription className="text-sm">
						Notice date: {formatDateShort(noticeDate)}
					</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<div className="relative max-h-48 overflow-hidden">
					<TiptapRenderer content={content} />
					<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-12 bg-linear-to-t from-card to-transparent" />
				</div>
				{onNoticeClick && (
					<div className="flex w-full justify-center">
						<Button
							className="mt-2 h-auto p-0 font-normal"
							onClick={onNoticeClick}
							variant="link"
						>
							View Notice...
						</Button>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex items-center justify-between border-t pt-4">
				<div className="text-muted-foreground text-sm">
					{type && (
						<>
							<span className="font-medium">Type:</span> {type}
						</>
					)}
				</div>
				<PublicNoticeBadge
					isArchived={isArchived}
					isPublished={isPublished}
					noticeDate={noticeDate}
				/>
			</CardFooter>
		</Card>
	);
}
