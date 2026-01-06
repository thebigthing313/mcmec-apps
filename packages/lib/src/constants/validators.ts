import z from "zod";
import { ErrorMessages } from "./errors";

export const EmailSchema = z.email(ErrorMessages.VALIDATION.INVALID_EMAIL);
export const PasswordSchema = z
	.string()
	.min(8, ErrorMessages.VALIDATION.PASSWORD_TOO_SHORT);
