import { AsYouType, parsePhoneNumber } from "libphonenumber-js/min";
import React, { useCallback, useMemo } from "react";
import { Input } from "../components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "../components/input-group";
import { cn } from "../lib/utils";

interface PhoneInputProps {
	id: string;
	name: string;
	value?: string;
	onChange?: (value: string | undefined) => void;
	className?: string;
	showExt?: boolean;
}

export function PhoneInput({
	id,
	value,
	name,
	onChange,
	className,
	showExt = true,
}: PhoneInputProps) {
	const countryCode = "US";

	const [rawPhone, setRawPhone] = React.useState("");
	const [ext, setExt] = React.useState("");
	const [isValid, setIsValid] = React.useState(true);

	const displayPhone = useMemo(() => {
		const formatter = new AsYouType(countryCode);
		return formatter.input(rawPhone);
	}, [rawPhone]);

	React.useEffect(() => {
		if (value) {
			try {
				const parsed = parsePhoneNumber(value);
				setRawPhone(parsed.nationalNumber);
				setExt(parsed.ext || "");
			} catch {
				const digits = value.replace(/\D/g, "");
				setRawPhone(digits);
				setExt("");
			}
		} else {
			setRawPhone("");
			setExt("");
		}
	}, [value]);

	const handlePhoneChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setRawPhone(e.target.value.replace(/\D/g, ""));
		},
		[],
	);

	const handleExtChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setExt(e.target.value);
		},
		[],
	);

	const handleBlur = useCallback(() => {
		if (!rawPhone.trim()) {
			onChange?.(undefined);
			setIsValid(true);
			return;
		}
		try {
			const fullText = ext ? `${rawPhone};${ext}` : rawPhone;
			const parsed = parsePhoneNumber(fullText, countryCode);
			setIsValid(true);
			const formatted = parsed.formatInternational();
			onChange?.(formatted);
		} catch {
			setIsValid(false);
			const fullString = ext ? `${displayPhone} ext. ${ext}` : displayPhone;
			onChange?.(fullString);
		}
	}, [rawPhone, ext, onChange, displayPhone]);

	return (
		<div className={cn("flex gap-2", className)}>
			<Input
				aria-invalid={!isValid}
				className={showExt ? "w-3/4" : "w-full"}
				onBlur={handleBlur}
				onChange={handlePhoneChange}
				type="text"
				value={displayPhone}
			/>
			{showExt && (
				<InputGroup className="w-1/4">
					<InputGroupAddon align="inline-start">ext.</InputGroupAddon>
					<InputGroupInput
						id={id}
						name={name}
						onBlur={handleBlur}
						onChange={handleExtChange}
						type="text"
						value={ext}
					/>
				</InputGroup>
			)}
		</div>
	);
}
