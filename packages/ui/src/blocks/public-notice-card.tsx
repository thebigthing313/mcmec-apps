"use client";

import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import type { JSONContent } from "@tiptap/react";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/badge";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../components/dialog";
import { Input } from "../components/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { PublicNoticeBadge } from "./public-notice-badge";
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
				<CardTitle
					className={`text-xl ${onNoticeClick ? "cursor-pointer hover:underline" : ""}`}
					onClick={onNoticeClick}
				>
					{title}
				</CardTitle>
				{showShare && (
					<CardAction>
						<Dialog onOpenChange={setOpen} open={open}>
							<Tooltip>
								<TooltipTrigger asChild>
									<DialogTrigger asChild>
										<Button
											aria-label="Share notice"
											size="icon"
											variant="ghost"
										>
											<Share2 />
										</Button>
									</DialogTrigger>
								</TooltipTrigger>
								<TooltipContent>Share this notice</TooltipContent>
							</Tooltip>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Share Notice</DialogTitle>
									<DialogDescription>
										Copy the link below to share this public notice
									</DialogDescription>
								</DialogHeader>
								<div className="flex items-center gap-2">
									<Input
										className="flex-1"
										onClick={(e) => e.currentTarget.select()}
										readOnly
										value={shareUrl}
									/>
									<Button
										aria-label={copied ? "Copied" : "Copy to clipboard"}
										onClick={handleCopy}
										size="icon"
										variant="outline"
									>
										{copied ? (
											<Check className="h-4 w-4" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
								<DialogFooter>
									<Button onClick={() => setOpen(false)} variant="outline">
										Close
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</CardAction>
				)}
				<CardDescription className="text-sm">
					Published on: {noticeDate ? formatDateShort(noticeDate) : "[unknown]"}
				</CardDescription>
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
					<span className="font-medium">Type:</span> {type}
				</div>
				{isPublished && isArchived && (
					<Badge variant="secondary">Archived</Badge>
				)}
				<PublicNoticeBadge
					isArchived={isArchived}
					isPublished={isPublished}
					noticeDate={noticeDate}
				/>
			</CardFooter>
		</Card>
	);
}
