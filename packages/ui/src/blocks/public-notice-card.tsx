"use client";

import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { Check, Copy, Share2 } from "lucide-react";
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
	content: string;
	noticeDate: Date;
	isPublished: boolean;
	className?: string;
}
export function PublicNoticeCard({
	title,
	type,
	content,
	noticeDate,
	isPublished,
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
					<Dialog open={open} onOpenChange={setOpen}>
						<Tooltip>
							<TooltipTrigger asChild>
								<DialogTrigger asChild>
									<Button variant="ghost" size="icon" aria-label="Share notice">
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
									value={currentUrl}
									readOnly
									className="flex-1"
									onClick={(e) => e.currentTarget.select()}
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={handleCopy}
									aria-label={copied ? "Copied" : "Copy to clipboard"}
								>
									{copied ? (
										<Check className="h-4 w-4" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setOpen(false)}>
									Close
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardAction>
				<CardDescription className="text-sm">
					Published on:{" "}
					{noticeDate ? new Date(noticeDate).toLocaleDateString() : "[unknown]"}
				</CardDescription>
			</CardHeader>
			<CardContent className="prose prose-sm dark:prose-invert max-w-none">
				<TiptapRenderer content={content} />
			</CardContent>
			<CardFooter className="flex items-center justify-between border-t pt-4">
				<div className="text-muted-foreground text-sm">
					<span className="font-medium">Type:</span> {type}
				</div>
				{isPublished && (
					<div className="flex items-center gap-1.5 text-green-600 text-sm dark:text-green-500">
						<div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500" />
						Published
					</div>
				)}
			</CardFooter>
		</Card>
	);
}
