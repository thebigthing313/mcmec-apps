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
				// `max-w-[70ch]` rather than `max-w-none`: DESIGN.md caps reading measure at
				// 65–75ch, and a Notice body rendered edge-to-edge in an 80rem container runs
				// well past 120 characters a line. `prose-base` at every width, because Body is
				// 1rem — the old `prose-sm` served a 14px legal notice on a phone.
				class: cn("prose prose-base max-w-[70ch] px-4 py-3", className),
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
		<div>
			<EditorContent editor={editor} />
		</div>
	);
}
