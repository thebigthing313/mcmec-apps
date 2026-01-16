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
import { TiptapRenderer } from "./tiptap-renderer";

interface PublicNoticeCardProps {
	title: string;
	type: string;
	content: string | JSONContent | null;
	noticeDate: Date;
	isPublished: boolean;
	isArchived: boolean;
	className?: string;
}
export function PublicNoticeCard({
	title,
	type,
	content,
	noticeDate,
	isPublished,
	isArchived,
	className,
}: PublicNoticeCardProps) {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	// Get current URL path
	const currentUrl = typeof window !== "undefined" ? window.location.href : "";

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(currentUrl);
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
			<CardHeader>
				<CardTitle className="text-xl">{title}</CardTitle>
				<CardAction>
					<Dialog onOpenChange={setOpen} open={open}>
						<Tooltip>
							<TooltipTrigger asChild>
								<DialogTrigger asChild>
									<Button aria-label="Share notice" size="icon" variant="ghost">
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
									value={currentUrl}
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
				<CardDescription className="text-sm">
					Published on: {noticeDate ? formatDateShort(noticeDate) : "[unknown]"}
				</CardDescription>
			</CardHeader>
			<CardContent className="prose prose-sm dark:prose-invert max-w-none">
				<TiptapRenderer content={content} />
			</CardContent>
			<CardFooter className="flex items-center justify-between border-t pt-4">
				<div className="text-muted-foreground text-sm">
					<span className="font-medium">Type:</span> {type}
				</div>
				{isPublished && isArchived && (
					<Badge variant="secondary">Archived</Badge>
				)}
				{isPublished && !isArchived && (
					<Badge variant="secondary">Current</Badge>
				)}
			</CardFooter>
		</Card>
	);
}
