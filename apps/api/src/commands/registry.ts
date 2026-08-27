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
import * as meetings from "./website/meetings";
import * as mosquitoActivity from "./website/mosquito-activity";
import * as noticeCategories from "./website/notice-categories";
import * as notices from "./website/notices";
import * as publicRequests from "./website/public-requests";
import * as sprayMissions from "./website/spray-missions";

export const REGISTRY: CommandRegistry = {
	"website.archiveNotice": notices.archiveNotice,
	"website.cancelMeeting": meetings.cancelMeeting,
	"website.cancelSprayMission": sprayMissions.cancelSprayMission,
	"website.closeJobPosting": jobPostings.closeJobPosting,
	"website.completeSprayMission": sprayMissions.completeSprayMission,
	"website.createDocument": documents.createDocument,
	"website.createDocumentCategory": documentCategories.createDocumentCategory,
	"website.createInsecticide": insecticides.createInsecticide,
	"website.createJobPosting": jobPostings.createJobPosting,
	"website.createMeeting": meetings.createMeeting,
	"website.createNotice": notices.createNotice,
	"website.createNoticeCategory": noticeCategories.createNoticeCategory,
	"website.createSprayMission": sprayMissions.createSprayMission,
	"website.delaySprayMission": sprayMissions.delaySprayMission,
	"website.deleteDocument": documents.deleteDocument,
	"website.deleteDocumentCategory": documentCategories.deleteDocumentCategory,
	"website.deleteInsecticide": insecticides.deleteInsecticide,
	"website.deleteJobPosting": jobPostings.deleteJobPosting,
	"website.deleteMeeting": meetings.deleteMeeting,
	"website.deleteNotice": notices.deleteNotice,
	"website.deleteNoticeCategory": noticeCategories.deleteNoticeCategory,
	"website.deleteRequest": publicRequests.deleteRequest,
	"website.deleteSprayMission": sprayMissions.deleteSprayMission,
	"website.importMosquitoActivity": mosquitoActivity.importMosquitoActivity,
	"website.publishDocument": documents.publishDocument,
	"website.publishJobPosting": jobPostings.publishJobPosting,
	"website.publishNotice": notices.publishNotice,
	"website.reopenJobPosting": jobPostings.reopenJobPosting,
	"website.reopenRequest": publicRequests.reopenRequest,
	"website.rescheduleSprayMission": sprayMissions.rescheduleSprayMission,
	"website.resolveRequest": publicRequests.resolveRequest,
	"website.submitPublicRequest": publicRequests.submitPublicRequest,
	"website.unarchiveNotice": notices.unarchiveNotice,
	"website.uncancelMeeting": meetings.uncancelMeeting,
	"website.unpublishDocument": documents.unpublishDocument,
	"website.unpublishJobPosting": jobPostings.unpublishJobPosting,
	"website.unpublishNotice": notices.unpublishNotice,
	"website.updateDocumentCategoryDetails":
		documentCategories.updateDocumentCategoryDetails,
	"website.updateDocumentDetails": documents.updateDocumentDetails,
	"website.updateInsecticideDetails": insecticides.updateInsecticideDetails,
	"website.updateJobPostingDetails": jobPostings.updateJobPostingDetails,
	"website.updateMeetingDetails": meetings.updateMeetingDetails,
	"website.updateNoticeCategoryDetails":
		noticeCategories.updateNoticeCategoryDetails,
	"website.updateNoticeDetails": notices.updateNoticeDetails,
	"website.updateSprayMissionDetails": sprayMissions.updateSprayMissionDetails,
};
