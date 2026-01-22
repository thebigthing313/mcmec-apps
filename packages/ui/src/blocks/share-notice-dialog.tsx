import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "../components/button";
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

interface ShareNoticeDialogProps {
	setOpen: (open: boolean) => void;
	open: boolean;
	shareUrl: string;
	copied: boolean;
	handleCopy: () => Promise<void>;
}
export function ShareNoticeDialog({
	setOpen,
	open,
	shareUrl,
	copied,
	handleCopy,
}: ShareNoticeDialogProps) {
	return (
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
	);
}
