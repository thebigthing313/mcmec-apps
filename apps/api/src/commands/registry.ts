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
import * as documentCategories from "./website/document-categories";
import * as documents from "./website/documents";
import * as insecticides from "./website/insecticides";
import * as jobPostings from "./website/job-postings";
import * as noticeCategories from "./website/notice-categories";
import * as notices from "./website/notices";

export const REGISTRY: CommandRegistry = {
	"website.archiveNotice": notices.archiveNotice,
	"website.closeJobPosting": jobPostings.closeJobPosting,
	"website.createDocument": documents.createDocument,
	"website.createDocumentCategory": documentCategories.createDocumentCategory,
	"website.createInsecticide": insecticides.createInsecticide,
	"website.createJobPosting": jobPostings.createJobPosting,
	"website.createNotice": notices.createNotice,
	"website.createNoticeCategory": noticeCategories.createNoticeCategory,
	"website.deleteDocument": documents.deleteDocument,
	"website.deleteDocumentCategory": documentCategories.deleteDocumentCategory,
	"website.deleteInsecticide": insecticides.deleteInsecticide,
	"website.deleteJobPosting": jobPostings.deleteJobPosting,
	"website.deleteNotice": notices.deleteNotice,
	"website.deleteNoticeCategory": noticeCategories.deleteNoticeCategory,
	"website.publishDocument": documents.publishDocument,
	"website.publishJobPosting": jobPostings.publishJobPosting,
	"website.publishNotice": notices.publishNotice,
	"website.reopenJobPosting": jobPostings.reopenJobPosting,
	"website.unarchiveNotice": notices.unarchiveNotice,
	"website.unpublishDocument": documents.unpublishDocument,
	"website.unpublishJobPosting": jobPostings.unpublishJobPosting,
	"website.unpublishNotice": notices.unpublishNotice,
	"website.updateDocumentCategoryDetails":
		documentCategories.updateDocumentCategoryDetails,
	"website.updateDocumentDetails": documents.updateDocumentDetails,
	"website.updateInsecticideDetails": insecticides.updateInsecticideDetails,
	"website.updateJobPostingDetails": jobPostings.updateJobPostingDetails,
	"website.updateNoticeCategoryDetails":
		noticeCategories.updateNoticeCategoryDetails,
	"website.updateNoticeDetails": notices.updateNoticeDetails,
};
