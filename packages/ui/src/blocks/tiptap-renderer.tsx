"use client";

import type { JSONContent } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "../lib/utils";

export interface TiptapRendererProps {
	content: JSONContent | string | null;
	className?: string;
}

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
	const editor = useEditor({
		content: content as JSONContent,
		editable: false,
		editorProps: {
			attributes: {
				class: cn(
					"prose prose-sm sm:prose-base max-w-none px-4 py-3",
					className,
				),
			},
		},
		extensions: [
			StarterKit,
			Link.configure({
				HTMLAttributes: {
					class: "text-primary underline",
				},
				openOnClick: true,
			}),
		],
	});

	if (!editor) {
		return null;
	}

	return (
		<div className="bg-background">
			<EditorContent editor={editor} />
		</div>
	);
}
