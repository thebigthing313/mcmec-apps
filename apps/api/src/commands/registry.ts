/**
 * Every command the vocabulary declares, mapped to the code that runs it.
 *
 * `CommandRegistry` is `Record<CommandName, CommandHandler>`, so this object is
 * exhaustiveness-checked against `@mcmec/domain`: add a definition there and this file stops
 * compiling until it is implemented. That compile error is the entire safety mechanism of the
 * define/implement split (#135 Q6).
 *
 * Each slice of the cutover adds its handlers here alongside its definitions.
 */
import type { CommandRegistry } from "./types";
import * as notices from "./website/notices";

export const REGISTRY: CommandRegistry = {
	"website.archiveNotice": notices.archiveNotice,
	"website.createNotice": notices.createNotice,
	"website.deleteNotice": notices.deleteNotice,
	"website.publishNotice": notices.publishNotice,
	"website.unarchiveNotice": notices.unarchiveNotice,
	"website.unpublishNotice": notices.unpublishNotice,
	"website.updateNoticeDetails": notices.updateNoticeDetails,
};
