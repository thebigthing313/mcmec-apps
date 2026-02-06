import { isValidPhoneNumber } from "libphonenumber-js";
import z from "zod";
import { ErrorMessages } from "./errors";

export const ValidEmailSchema = z.email(ErrorMessages.VALIDATION.INVALID_EMAIL);
export const PasswordSchema = z
	.string()
	.min(8, ErrorMessages.VALIDATION.PASSWORD_TOO_SHORT);
export const NonEmptyStringSchema = (minLength: number = 1) =>
	z
		.string()
		.min(minLength, ErrorMessages.VALIDATION.FIELD_TOO_SHORT(minLength));
export const NonEmptyDateSchema = z.date(ErrorMessages.VALIDATION.REQUIRED);
export const NonEmptyUUID = z.uuid(ErrorMessages.VALIDATION.REQUIRED);
export const ValidURLSchema = z.url(ErrorMessages.VALIDATION.INVALID_URL);
export const ValidPhoneNumberSchema = z.string().refine(
	(val) => {
		return isValidPhoneNumber(val, "US");
	},
	{
		message: ErrorMessages.VALIDATION.INVALID_PHONE_NUMBER,
	},
);
