"use client";

import type { JSONContent } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Quote,
	Redo,
	Strikethrough,
	Undo,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../components/dialog";
import { Input } from "../components/input";
import { Label } from "../components/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../components/tooltip";
import { cn } from "../lib/utils";

export interface TiptapEditorProps {
	content?: JSONContent | string | null;
	onChange?: (content: JSONContent) => void;
	placeholder?: string;
	editable?: boolean;
	className?: string;
}

export function TiptapEditor({
	content,
	onChange,
	placeholder = "Start typing...",
	editable = true,
	className,
}: TiptapEditorProps) {
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [linkText, setLinkText] = useState("");

	const editor = useEditor({
		content: content as JSONContent,
		editable,
		editorProps: {
			attributes: {
				class: cn(
					"prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] px-4 py-3",
					className,
				),
				"data-placeholder": placeholder,
			},
		},
		extensions: [
			StarterKit,
			Link.configure({
				HTMLAttributes: {
					class: "text-primary underline cursor-pointer",
				},
				openOnClick: false,
			}),
		],
		onUpdate: ({ editor }) => {
			onChange?.(editor.getJSON());
		},
	});

	if (!editor) {
		return null;
	}

	const openLinkDialog = () => {
		const previousUrl = editor.getAttributes("link").href || "";
		const { from, to } = editor.state.selection;
		const text = editor.state.doc.textBetween(from, to, "");

		setLinkUrl(previousUrl);
		setLinkText(text);
		setLinkDialogOpen(true);
	};

	const setLink = () => {
		if (!linkUrl) {
			editor.chain().focus().unsetLink().run();
			setLinkDialogOpen(false);
			return;
		}

		// If there's link text, insert it with the link
		if (linkText?.trim()) {
			editor
				.chain()
				.focus()
				.insertContent({
					marks: [{ attrs: { href: linkUrl }, type: "link" }],
					text: linkText,
					type: "text",
				})
				.run();
		} else {
			// If no text, just set link on current selection
			editor.chain().focus().setLink({ href: linkUrl }).run();
		}

		setLinkDialogOpen(false);
		setLinkUrl("");
		setLinkText("");
	};

	return (
		<>
			<Dialog onOpenChange={setLinkDialogOpen} open={linkDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Link</DialogTitle>
						<DialogDescription>
							Enter the link text and URL below.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="link-text">Link Text</Label>
							<Input
								id="link-text"
								onChange={(e) => setLinkText(e.target.value)}
								placeholder="Enter link text"
								value={linkText}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="link-url">URL</Label>
							<Input
								id="link-url"
								onChange={(e) => setLinkUrl(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										setLink();
									}
								}}
								placeholder="https://example.com"
								value={linkUrl}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={() => setLinkDialogOpen(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button onClick={setLink} type="button">
							{linkUrl && editor.getAttributes("link").href
								? "Update Link"
								: "Add Link"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<div className="overflow-hidden rounded-lg border bg-background">
				{editable && (
					<div className="flex flex-wrap gap-1 border-b bg-muted/50 p-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("bold") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										disabled={!editor.can().chain().focus().toggleBold().run()}
										onClick={() => editor.chain().focus().toggleBold().run()}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Bold className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Bold</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("italic") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										disabled={
											!editor.can().chain().focus().toggleItalic().run()
										}
										onClick={() => editor.chain().focus().toggleItalic().run()}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Italic className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Italic</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("strike") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										disabled={
											!editor.can().chain().focus().toggleStrike().run()
										}
										onClick={() => editor.chain().focus().toggleStrike().run()}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Strikethrough className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Strikethrough</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("code") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										disabled={!editor.can().chain().focus().toggleCode().run()}
										onClick={() => editor.chain().focus().toggleCode().run()}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Code className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Code</TooltipContent>
							</Tooltip>

							<div className="mx-1 h-8 w-px bg-border" />

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("heading", { level: 1 })
												? "bg-muted"
												: "",
											"h-8 w-8 p-0",
										)}
										onClick={() =>
											editor.chain().focus().toggleHeading({ level: 1 }).run()
										}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Heading1 className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Heading 1</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("heading", { level: 2 })
												? "bg-muted"
												: "",
											"h-8 w-8 p-0",
										)}
										onClick={() =>
											editor.chain().focus().toggleHeading({ level: 2 }).run()
										}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Heading2 className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Heading 2</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("heading", { level: 3 })
												? "bg-muted"
												: "",
											"h-8 w-8 p-0",
										)}
										onClick={() =>
											editor.chain().focus().toggleHeading({ level: 3 }).run()
										}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Heading3 className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Heading 3</TooltipContent>
							</Tooltip>

							<div className="mx-1 h-8 w-px bg-border" />

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("bulletList") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										onClick={() =>
											editor.chain().focus().toggleBulletList().run()
										}
										size="sm"
										type="button"
										variant="ghost"
									>
										<List className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Bullet List</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("orderedList") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										onClick={() =>
											editor.chain().focus().toggleOrderedList().run()
										}
										size="sm"
										type="button"
										variant="ghost"
									>
										<ListOrdered className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Numbered List</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("blockquote") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										onClick={() =>
											editor.chain().focus().toggleBlockquote().run()
										}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Quote className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Quote</TooltipContent>
							</Tooltip>

							<div className="mx-1 h-8 w-px bg-border" />

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											editor.isActive("link") ? "bg-muted" : "",
											"h-8 w-8 p-0",
										)}
										onClick={openLinkDialog}
										size="sm"
										type="button"
										variant="ghost"
									>
										<LinkIcon className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Add Link</TooltipContent>
							</Tooltip>

							<div className="mx-1 h-8 w-px bg-border" />

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="h-8 w-8 p-0"
										disabled={!editor.can().chain().focus().undo().run()}
										onClick={() => editor.chain().focus().undo().run()}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Undo className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Undo</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="h-8 w-8 p-0"
										disabled={!editor.can().chain().focus().redo().run()}
										onClick={() => editor.chain().focus().redo().run()}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Redo className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Redo</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
				<EditorContent editor={editor} />
			</div>
		</>
	);
}
