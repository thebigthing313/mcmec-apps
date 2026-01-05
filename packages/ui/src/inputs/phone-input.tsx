import "flag-icons/css/flag-icons.min.css";
import {
	AsYouType,
	type CountryCode,
	getCountries,
	isSupportedCountry,
	parsePhoneNumber,
} from "libphonenumber-js/min";
import React, { useCallback, useMemo } from "react";
import { Button } from "../components/button";
import { ButtonGroup } from "../components/button-group";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "../components/command";
import { Input } from "../components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "../components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/utils";

interface PhoneInputProps {
	id: string;
	name: string;
	value?: string;
	onChange?: (value: string | undefined) => void;
	className?: string;
	showExt?: boolean;
}

const validCodes = getCountries();

function getCountryCode(): CountryCode {
	const locale = new Intl.NumberFormat().resolvedOptions().locale;
	const parts = locale.split("-");
	const potentialCode = (parts[1] || parts[0] || "US").toUpperCase();
	return validCodes.includes(potentialCode as CountryCode)
		? (potentialCode as CountryCode)
		: "US";
}

export function PhoneInput({
	id,
	value,
	name,
	onChange,
	className,
	showExt = true,
}: PhoneInputProps) {
	const [countryCode, setCountryCode] = React.useState<CountryCode>(
		getCountryCode(),
	);

	const [rawPhone, setRawPhone] = React.useState("");
	const [ext, setExt] = React.useState("");
	const [isValid, setIsValid] = React.useState(true);

	const displayPhone = useMemo(() => {
		const formatter = new AsYouType(countryCode);
		return formatter.input(rawPhone);
	}, [rawPhone, countryCode]);

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
	}, [rawPhone, ext, countryCode, onChange, displayPhone]);

	return (
		<div className={cn("flex gap-2", className)}>
			<ButtonGroup className={cn(showExt ? "w-3/4" : "w-full", className)}>
				<FlagButton onSelect={setCountryCode} currentCode={countryCode} />
				<Input
					type="text"
					value={displayPhone}
					onChange={handlePhoneChange}
					onBlur={handleBlur}
					aria-invalid={!isValid}
				/>
			</ButtonGroup>
			{showExt && (
				<InputGroup className="w-1/4">
					<InputGroupAddon align="inline-start">ext.</InputGroupAddon>
					<InputGroupInput
						id={id}
						name={name}
						type="text"
						value={ext}
						onChange={handleExtChange}
						onBlur={handleBlur}
					/>
				</InputGroup>
			)}
		</div>
	);
}

interface ButtonImageProps {
	countryCode?: string;
	className?: string;
}

function ButtonImage({ countryCode, className }: ButtonImageProps) {
	if (!countryCode) {
		return <span className={className}>--</span>;
	}
	if (isSupportedCountry(countryCode)) {
		return (
			<span className={cn(`fi fi-${countryCode.toLowerCase()}`, className)} />
		);
	} else {
		return <span className={className}>{countryCode.toUpperCase()}</span>;
	}
}

interface FlagButtonProps {
	onSelect: (code: CountryCode) => void;
	currentCode: CountryCode;
}

function FlagButton({ onSelect, currentCode }: FlagButtonProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="icon">
					<ButtonImage className="p-1" countryCode={currentCode} />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-37.5">
				<Command>
					<CommandInput placeholder="Search..." />
					<CommandEmpty>None found.</CommandEmpty>
					<CommandGroup
						className="max-h-64 overflow-y-auto"
						heading="Country Codes"
					>
						{validCodes.map((code) => (
							<CommandItem
								key={code}
								value={code}
								onSelect={(currentValue) => {
									onSelect(currentValue as CountryCode);
									setOpen(false);
								}}
							>
								{code}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
