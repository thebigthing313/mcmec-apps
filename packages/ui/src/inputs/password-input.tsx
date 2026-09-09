"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import React from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../components/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";

interface PasswordInputProps {
	className?: string;
}
export function PasswordInput({
	className,
	ref,
	...props
}: PasswordInputProps & Omit<React.ComponentPropsWithRef<"input">, "type">) {
	const [visible, setVisible] = React.useState(false);

	return (
		<InputGroup className={className}>
			<InputGroupInput
				ref={ref}
				type={visible ? "text" : "password"}
				{...props}
			/>
			<InputGroupAddon align="inline-end">
				<Tooltip>
					<TooltipTrigger asChild>
						<InputGroupButton
							aria-label={visible ? "Hide password" : "Show password"}
							onClick={() => setVisible(!visible)}
							size="icon-sm"
							variant="ghost"
						>
							{visible ? <EyeOffIcon /> : <EyeIcon />}
						</InputGroupButton>
					</TooltipTrigger>
					<TooltipContent>Toggle Visibility</TooltipContent>
				</Tooltip>
			</InputGroupAddon>
		</InputGroup>
	);
}
