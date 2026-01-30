"use client";

import { CheckCircle, ClipboardPaste, EraserIcon } from "lucide-react";
import { toast } from "sonner";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../components/input-group";
import { Spinner } from "../components/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";

interface TextInputProps {
	showSpinner?: boolean;
	showValid?: boolean;
	showPaste?: boolean;
	showClear?: boolean;
	className?: string;
}

export function TextInput({
	className,
	showSpinner = false,
	showPaste = false,
	showClear = false,
	showValid = false,
	ref,
	...props
}: TextInputProps & React.ComponentPropsWithRef<"input">) {
	function handlePaste() {
		try {
			navigator.clipboard.readText().then((text) => {
				props.onChange?.({
					target: { value: text },
				} as React.ChangeEvent<HTMLInputElement>);
			});
		} catch {
			toast.warning(
				"Failed to paste from clipboard. Please check clipboard permissions.",
			);
		}
	}

	return (
		<InputGroup className={className}>
			<InputGroupInput ref={ref} type="text" {...props} />
			<InputGroupAddon align="inline-end">
				{showSpinner && <Spinner />}
				{showPaste && (
					<Tooltip>
						<TooltipTrigger asChild>
							<InputGroupButton
								aria-label="Paste from clipboard"
								onClick={handlePaste}
								size="icon-sm"
								variant="ghost"
							>
								<ClipboardPaste />
							</InputGroupButton>
						</TooltipTrigger>
						<TooltipContent>Paste from Clipboard</TooltipContent>
					</Tooltip>
				)}
				{showClear && (
					<Tooltip>
						<TooltipTrigger asChild>
							<InputGroupButton
								aria-label="Clear input"
								onClick={() => {
									if (props.type === "file") {
										if (ref && "current" in ref && ref.current) {
											ref.current.value = "";
										}
										props.onChange?.({
											target: { files: null, value: "" },
										} as React.ChangeEvent<HTMLInputElement>);
									} else {
										props.onChange?.({
											target: { value: "" },
										} as React.ChangeEvent<HTMLInputElement>);
									}
								}}
								size="icon-sm"
								variant="ghost"
							>
								<EraserIcon />
							</InputGroupButton>
						</TooltipTrigger>
						<TooltipContent>Clear Input</TooltipContent>
					</Tooltip>
				)}
				{showValid && <CheckCircle />}
			</InputGroupAddon>
		</InputGroup>
	);
}
