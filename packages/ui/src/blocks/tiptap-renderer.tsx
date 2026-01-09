"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "../lib/utils";
import { type JSONContent } from "@tiptap/core";

export interface TiptapRendererProps {
	content: JSONContent | string | null;
	className?: string;
}

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
	const editor = useEditor({
		extensions: [StarterKit],
		content: content as JSONContent,
		editable: false,
		editorProps: {
			attributes: {
				class: cn("prose prose-sm sm:prose-base max-w-none px-4 py-3", className),
			},
		},
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
