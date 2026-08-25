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
import * as jobPostings from "./website/job-postings";
import * as notices from "./website/notices";

export const REGISTRY: CommandRegistry = {
	"website.archiveNotice": notices.archiveNotice,
	"website.closeJobPosting": jobPostings.closeJobPosting,
	"website.createJobPosting": jobPostings.createJobPosting,
	"website.createNotice": notices.createNotice,
	"website.deleteJobPosting": jobPostings.deleteJobPosting,
	"website.deleteNotice": notices.deleteNotice,
	"website.publishJobPosting": jobPostings.publishJobPosting,
	"website.publishNotice": notices.publishNotice,
	"website.reopenJobPosting": jobPostings.reopenJobPosting,
	"website.unarchiveNotice": notices.unarchiveNotice,
	"website.unpublishJobPosting": jobPostings.unpublishJobPosting,
	"website.unpublishNotice": notices.unpublishNotice,
	"website.updateJobPostingDetails": jobPostings.updateJobPostingDetails,
	"website.updateNoticeDetails": notices.updateNoticeDetails,
};
