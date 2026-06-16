import arcaWebapi from "@/shared/api/arca-webapi"
import * as components from "./arca_apiComponents"
export * from "./arca_apiComponents"

/**
 * @description 
 * @param params
 */
export function appLoginRedirect(params: components.AppLoginRedirectRequestParams) {
	return arcaWebapi.post<components.AppLoginRedirectResponse>(`/auth/app_login_redirect`, params)
}

/**
 * @description 
 * @param req
 */
export function emailLogin(req: components.EmailSessionReq) {
	return arcaWebapi.post<components.LoginResp>(`/auth/email/sessions`, req)
}

/**
 * @description 
 * @param params
 * @param req
 * @param headers
 */
export function sendEmailCode(params: components.EmailCodeReqParams, req: components.EmailCodeReq, headers: components.EmailCodeReqHeaders) {
	return arcaWebapi.post<components.EmailCodeResp>(`/auth/email/verification-codes`, params, req, headers)
}

/**
 * @description 
 * @param params
 * @param req
 */
export function oauthLogin(params: components.OAuthSessionReqParams, req: components.OAuthSessionReq, provider: string) {
	return arcaWebapi.post<components.LoginResp>(`/auth/oauth/${provider}/sessions`, params, req)
}

/**
 * @description 
 * @param req
 */
export function sendCode(req: components.SendCodeReq) {
	return arcaWebapi.post<components.SendCodeResp>(`/auth/send_code`, req)
}

/**
 * @description 
 * @param req
 */
export function verifyCode(req: components.VerifyCodeReq) {
	return arcaWebapi.post<components.VerifyCodeResp>(`/auth/verify_code`, req)
}

/**
 * @description 
 * @param req
 */
export function createStylePrompt(req: components.CreateStylePromptReq) {
	return arcaWebapi.post<components.CreateStylePromptResp>(`/internal/ops/style_prompt/create`, req)
}

/**
 * @description 
 * @param req
 */
export function deleteStylePrompt(req: components.DeleteStylePromptReq) {
	return arcaWebapi.post<components.DeleteStylePromptResp>(`/internal/ops/style_prompt/delete`, req)
}

/**
 * @description 
 */
export function listStylePrompt() {
	return arcaWebapi.post<components.ListStylePromptResp>(`/internal/ops/style_prompt/list`)
}

/**
 * @description 
 * @param req
 */
export function updateStylePrompt(req: components.UpdateStylePromptReq) {
	return arcaWebapi.post<components.UpdateStylePromptResp>(`/internal/ops/style_prompt/update`, req)
}

/**
 * @description 
 * @param req
 */
export function internalToolGenJwtToken(req: components.InternalToolGenJwtTokenReq) {
	return arcaWebapi.post<components.InternalToolGenJwtTokenResp>(`/internal/tool/gen_jwt_token`, req)
}

/**
 * @description 
 * @param req
 */
export function internalToolMockReportAppState(req: components.InternalToolMockReportAppStateReq) {
	return arcaWebapi.post<components.ReportAppStateResp>(`/internal/tool/mock_report_app_state`, req)
}

/**
 * @description 
 * @param req
 */
export function scheduledPrint(req: components.ScheduledPrintReq) {
	return arcaWebapi.post<components.ScheduledPrintResp>(`/api/test/scheduled_print`, req)
}

/**
 * @description 
 * @param req
 */
export function agreeTerms(req: components.AgreeTermsReq) {
	return arcaWebapi.post<components.AgreeTermsResp>(`/app/agree_terms`, req)
}

/**
 * @description 
 * @param req
 */
export function auditImage(req: components.AuditImageReq) {
	return arcaWebapi.post<components.AuditImageResp>(`/audit/image`, req)
}

/**
 * @description 
 * @param req
 */
export function auditText(req: components.AuditTextReq) {
	return arcaWebapi.post<components.AuditTextResp>(`/audit/text`, req)
}

/**
 * @description 
 * @param req
 */
export function getImageMainColor(req: components.GetImageMainColorReq) {
	return arcaWebapi.post<components.GetImageMainColorResp>(`/file/image_main_color`, req)
}

/**
 * @description 
 * @param req
 */
export function processImage(req: components.ProcessImageReq) {
	return arcaWebapi.post<components.AsyncTaskSubmitResp>(`/file/process_image`, req)
}

/**
 * @description 
 * @param req
 */
export function getTosUploadCredential(req: components.GetTosUploadCredentialReq) {
	return arcaWebapi.post<components.GetTosUploadCredentialResp>(`/file/tos_credential`, req)
}

/**
 * @description 
 * @param req
 */
export function getTaskStatus(req: components.GetTaskStatusReq) {
	return arcaWebapi.post<components.GetTaskStatusResp>(`/task/get_status`, req)
}

/**
 * @description 
 * @param req
 */
export function retryAsyncTask(req: components.RetryAsyncTaskReq) {
	return arcaWebapi.post<components.RetryAsyncTaskResp>(`/task/retry`, req)
}

/**
 * @description 
 */
export function getAppConfig() {
	return arcaWebapi.post<components.AppConfigResp>(`/app/config`)
}

/**
 * @description 
 */
export function getIPRegion() {
	return arcaWebapi.get<components.GetIPRegionResp>(`/app/ip_region`)
}

/**
 * @description 
 * @param req
 */
export function reportAppState(req: components.ReportAppStateReq) {
	return arcaWebapi.post<components.ReportAppStateResp>(`/app/report_app_state`, req)
}

/**
 * @description 
 */
export function getTerms() {
	return arcaWebapi.get<components.AppTermsResp>(`/app/terms`)
}

/**
 * @description 
 * @param req
 */
export function reportAppLog(req: components.ReportAppLogReq) {
	return arcaWebapi.post<components.ReportAppLogResp>(`/report/app_log`, req)
}

/**
 * @description 
 */
export function getBodyConfig() {
	return arcaWebapi.post<components.BodyConfigResp>(`/character/body_config`)
}

/**
 * @description 
 * @param req
 */
export function chatWithCharacter(req: components.ChatWithCharacterReq) {
	return arcaWebapi.post<components.ChatWithCharacterResp>(`/character/chat`, req)
}

/**
 * @description 
 * @param req
 */
export function syncChatWithCharacter(req: components.ChatWithCharacterReq) {
	return arcaWebapi.post<components.ChatWithCharacterResp>(`/character/chat_with_character`, req)
}

/**
 * @description 
 * @param req
 */
export function createCharacter(req: components.CreateCharacterReq) {
	return arcaWebapi.post<components.AsyncTaskSubmitResp>(`/character/create`, req)
}

/**
 * @description 
 * @param req
 */
export function createCharacterAppearance(req: components.CreateAppearanceReq) {
	return arcaWebapi.post<components.CreateAppearanceResp>(`/character/create_appearance`, req)
}

/**
 * @description 
 * @param req
 */
export function deleteCharacter(req: components.DeleteCharacterReq) {
	return arcaWebapi.post<components.DeleteCharacterResp>(`/character/delete`, req)
}

/**
 * @description 
 * @param req
 */
export function deleteCharacterDraft(req: components.DeleteCharacterDraftReq) {
	return arcaWebapi.post<components.DeleteCharacterDraftResp>(`/character/delete_draft`, req)
}

/**
 * @description 
 * @param req
 */
export function getCharacterDetail(req: components.GetCharacterDetailReq) {
	return arcaWebapi.get<components.GetCharacterDetailResp>(`/character/detail`, req)
}

/**
 * @description 
 * @param req
 */
export function draftChat(req: components.DraftChatReq) {
	return arcaWebapi.post<components.DraftChatResp>(`/character/draft_chat`, req)
}

/**
 * @description 
 * @param params
 */
export function getCharacterDraftDetail(params: components.GetCharacterDraftDetailReqParams) {
	return arcaWebapi.get<components.GetCharacterDraftDetailResp>(`/character/draft_detail`, params)
}

/**
 * @description 
 * @param req
 */
export function forwardPostToCharacter(req: components.ForwardPostToCharacterReq) {
	return arcaWebapi.post<components.ForwardPostToCharacterResp>(`/character/forward_post`, req)
}

/**
 * @description 
 * @param req
 */
export function genAppearanceFromInput(req: components.GenAppearanceFromInputReq) {
	return arcaWebapi.post<components.AsyncTaskSubmitResp>(`/character/gen_appearance`, req)
}

/**
 * @description 
 * @param req
 */
export function genLandingPage(req: components.GenLandingPageReq) {
	return arcaWebapi.post<components.GenLandingPageResp>(`/character/gen_landing_page`, req)
}

/**
 * @description 
 * @param req
 */
export function generateCharacterSchedule(req: components.GenerateCharacterScheduleReq) {
	return arcaWebapi.post<components.GenerateCharacterScheduleResp>(`/character/generate_schedule`, req)
}

/**
 * @description 
 * @param req
 */
export function getCharacterMemories(req: components.GetCharacterMemoriesReq) {
	return arcaWebapi.post<components.GetCharacterGroupMemoriesResp>(`/character/get_memories`, req)
}

/**
 * @description 
 * @param req
 */
export function getSoulWordEvaluation(req: components.GetSoulWordEvaluationReq) {
	return arcaWebapi.post<components.GetSoulWordEvaluationResp>(`/character/get_soul_word_evaluation`, req)
}

/**
 * @description 
 * @param req
 */
export function listCharacterAppearances(req: components.ListCharacterAppearancesReq) {
	return arcaWebapi.post<components.ListCharacterAppearancesResp>(`/character/list_appearances`, req)
}

/**
 * @description 
 * @param req
 */
export function listCopyableCharacters(req: components.ListCopyableCharactersReq) {
	return arcaWebapi.post<components.ListCopyableCharactersResp>(`/character/list_copyable_characters`, req)
}

/**
 * @description 
 */
export function listCharacterDrafts() {
	return arcaWebapi.post<components.ListCharacterDraftsResp>(`/character/list_drafts`)
}

/**
 * @description 
 * @param req
 */
export function listUserCharacters(req: components.ListUserCharactersReq) {
	return arcaWebapi.post<components.ListUserCharactersResp>(`/character/list_my_characters`, req)
}

/**
 * @description 
 * @param req
 */
export function list_character_phone_chat_history(req: components.ListCharacterPhoneChatHistoryReq) {
	return arcaWebapi.post<components.ListCharacterPhoneChatHistoryResp>(`/character/list_phone_chat_history`, req)
}

/**
 * @description 
 * @param req
 */
export function listCharacterScheduleByDay(req: components.ListCharacterScheduleByDayReq) {
	return arcaWebapi.post<components.ListCharacterScheduleByDayResp>(`/character/list_schedule_by_day`, req)
}

/**
 * @description 
 * @param req
 */
export function memoryRollback(req: components.MemoryRollbackReq) {
	return arcaWebapi.post<components.MemoryRollbackResp>(`/character/memory_rollback`, req)
}

/**
 * @description 
 */
export function getCharacterPageConfig() {
	return arcaWebapi.get<components.GetCharacterPageConfigResp>(`/character/page_config`)
}

/**
 * @description 
 * @param req
 */
export function pinCharacter(req: components.PinCharacterReq) {
	return arcaWebapi.post<components.PinCharacterResp>(`/character/pin`, req)
}

/**
 * @description 
 * @param req
 */
export function saveCharacterDraft(req: components.SaveCharacterDraftReq) {
	return arcaWebapi.post<components.SaveCharacterDraftResp>(`/character/save_draft`, req)
}

/**
 * @description 
 * @param req
 */
export function submitCharacterDraft(req: components.SubmitCharacterDraftReq) {
	return arcaWebapi.post<components.SubmitCharacterDraftResp>(`/character/submit_draft`, req)
}

/**
 * @description 
 * @param req
 */
export function switchCharacterOutfit(req: components.SwitchOutfitReq) {
	return arcaWebapi.post<components.SwitchOutfitResp>(`/character/switch_outfit`, req)
}

/**
 * @description 
 * @param req
 */
export function unpinCharacter(req: components.UnpinCharacterReq) {
	return arcaWebapi.post<components.UnpinCharacterResp>(`/character/unpin`, req)
}

/**
 * @description 
 * @param req
 */
export function updateCharacterBasicInfo(req: components.UpdateCharacterBasicInfoReq) {
	return arcaWebapi.post<components.UpdateCharacterBasicInfoResp>(`/character/updateBasicInfo`, req)
}

/**
 * @description 
 * @param req
 */
export function updateCharacterAppearance(req: components.UpdateAppearanceReq) {
	return arcaWebapi.post<components.UpdateAppearanceResp>(`/character/update_appearance`, req)
}

/**
 * @description 
 * @param req
 */
export function updateIsNewStatus(req: components.UpdateIsNewStatusReq) {
	return arcaWebapi.post<components.UpdateIsNewStatusResp>(`/character/update_is_new_status`, req)
}

/**
 * @description 
 * @param req
 */
export function updateMessageClickStatus(req: components.UpdateMessageClickStatusReq) {
	return arcaWebapi.post<components.UpdateMessageClickStatusResp>(`/character/update_message_click_status`, req)
}

/**
 * @description 
 * @param req
 */
export function updateMessageReadStatus(req: components.UpdateMessageReadStatusReq) {
	return arcaWebapi.post<components.UpdateMessageReadStatusResp>(`/character/update_message_read_status`, req)
}

/**
 * @description 
 * @param req
 */
export function updateScheduleViewedStatus(req: components.UpdateScheduleViewedStatusReq) {
	return arcaWebapi.post<components.UpdateScheduleViewedStatusResp>(`/character/update_schedule_viewed_status`, req)
}

/**
 * @description 
 * @param req
 */
export function deleteMemory(req: components.DeleteMemoryReq) {
	return arcaWebapi.post<components.DeleteMemoryResp>(`/memory/delete`, req)
}

/**
 * @description 
 * @param req
 */
export function getMemoryNarratives(req: components.GetMemoryNarrativesReq) {
	return arcaWebapi.post<components.GetMemoryNarrativesResp>(`/memory/get_narratives`, req)
}

/**
 * @description 
 * @param req
 */
export function favouriteScript(req: components.FavouriteScriptReq) {
	return arcaWebapi.post<components.FavouriteScriptResp>(`/feed/favourite_script`, req)
}

/**
 * @description 
 */
export function getSearchHint() {
	return arcaWebapi.post<components.GetSearchHintResp>(`/feed/get_search_hint`)
}

/**
 * @description 
 */
export function listPlayWithCharacters() {
	return arcaWebapi.post<components.ListPlayWithCharactersResp>(`/feed/list_play_with_characters`)
}

/**
 * @description 
 * @param req
 */
export function unfavouriteScript(req: components.UnfavouriteScriptReq) {
	return arcaWebapi.post<components.UnfavouriteScriptResp>(`/feed/unfavourite_script`, req)
}

/**
 * @description 
 * @param req
 */
export function feedItemReport(req: components.FeedItemReportReq) {
	return arcaWebapi.post<components.FeedItemReportResp>(`/feed/item_report`, req)
}

/**
 * @description 
 * @param req
 */
export function feedMoreCharacters(req: components.FeedMoreCharactersReq) {
	return arcaWebapi.post<components.FeedMoreCharactersResp>(`/feed/more_characters`, req)
}

/**
 * @description 
 * @param req
 */
export function feedPopopSearch(req: components.FeedPopopSearchReq) {
	return arcaWebapi.post<components.FeedPopopSearchResp>(`/feed/popop_search`, req)
}

/**
 * @description 
 * @param req
 */
export function recPopop(req: components.FeedRecPopopReq) {
	return arcaWebapi.post<components.FeedRecPopopResp>(`/feed/rec_popop`, req)
}

/**
 * @description 
 * @param req
 */
export function feedRecallCharacters(req: components.FeedRecallCharactersReq) {
	return arcaWebapi.post<components.FeedRecallCharactersResp>(`/feed/recall_characters`, req)
}

/**
 * @description 
 * @param req
 */
export function feedRecommendation(req: components.FeedRecommendationReq) {
	return arcaWebapi.post<components.FeedRecommendationResp>(`/feed/recommendation`, req)
}

/**
 * @description 
 */
export function getFeedTags() {
	return arcaWebapi.get<components.GetFeedTagsResp>(`/feed/tags`)
}

/**
 * @description 
 */
export function deregister() {
	return arcaWebapi.delete<components.DeregisterResp>(`/user/account`)
}

/**
 * @description 
 */
export function getUserHomePageStat() {
	return arcaWebapi.post<components.GetUserHomePageStatResp>(`/user/get_home_page_stat`)
}

/**
 * @description 
 * @param req
 */
export function getUserInfo(req: components.GetUserInfoReq) {
	return arcaWebapi.post<components.GetUserInfoResp>(`/user/get_user_info`, req)
}

/**
 * @description 
 * @param req
 */
export function updateUserInfo(req: components.UpdateUserInfoReq) {
	return arcaWebapi.post<components.UpdateUserInfoResp>(`/user/update_user_info`, req)
}

/**
 * @description 
 */
export function guestGetFeedTags() {
	return arcaWebapi.get<components.GetFeedTagsResp>(`/guest/feed_tags`)
}

/**
 * @description 
 * @param req
 */
export function listViewerCharacters(req: components.ListViewerCharactersReq) {
	return arcaWebapi.post<components.ListViewerCharactersResp>(`/viewer/characters`, req)
}

/**
 * @description 
 * @param req
 */
export function listViewerMaterials(req: components.ListViewerMaterialsReq) {
	return arcaWebapi.post<components.ListViewerMaterialsResp>(`/viewer/materials`, req)
}

/**
 * @description 
 */
export function listViewerSubjects() {
	return arcaWebapi.post<components.ListViewerSubjectsResp>(`/viewer/subjects`)
}

/**
 * @description 
 * @param req
 */
export function internalGetAppRTOverview(req: components.GetAppRTOverviewReq) {
	return arcaWebapi.post<components.AppRTOverviewResp>(`/internal/app_rt/overview`, req)
}

/**
 * @description 
 * @param req
 */
export function internalGetAppRTRankings(req: components.GetAppRTRankingsReq) {
	return arcaWebapi.post<components.GetAppRTRankingsResp>(`/internal/app_rt/rankings`, req)
}

/**
 * @description 
 * @param req
 */
export function sendPushSync(req: components.SendPushSyncReq) {
	return arcaWebapi.post<components.SendPushSyncResp>(`/app/send_push_sync`, req)
}

/**
 * @description 
 */
export function getPushSettings() {
	return arcaWebapi.post<components.GetPushSettingsResp>(`/app/get_push_settings`)
}

/**
 * @description 
 * @param req
 */
export function registerPushToken(req: components.RegisterPushTokenReq) {
	return arcaWebapi.post<components.RegisterPushTokenResp>(`/app/register_push_token`, req)
}

/**
 * @description 
 * @param req
 */
export function reportPushClick(req: components.ReportPushClickReq) {
	return arcaWebapi.post<components.ReportPushClickResp>(`/app/report_push_click`, req)
}

/**
 * @description 
 */
export function unregisterPushToken() {
	return arcaWebapi.post<components.UnregisterPushTokenResp>(`/app/unregister_push_token`)
}

/**
 * @description 
 * @param req
 */
export function updatePushSettings(req: components.UpdatePushSettingsReq) {
	return arcaWebapi.post<components.UpdatePushSettingsResp>(`/app/update_push_settings`, req)
}

/**
 * @description 
 * @param req
 */
export function internalImportRoleExportsCancel(req: components.ImportRoleExportsCancelReq) {
	return arcaWebapi.post<components.ImportRoleExportsCancelResp>(`/internal/import/role_exports/cancel`, req)
}

/**
 * @description 
 * @param req
 */
export function internalImportRoleExportsRecent(req: components.ImportRoleExportsRecentReq) {
	return arcaWebapi.post<components.ImportRoleExportsRecentResp>(`/internal/import/role_exports/recent`, req)
}

/**
 * @description 
 * @param req
 */
export function internalImportRoleExportsStart(req: components.ImportRoleExportsStartReq) {
	return arcaWebapi.post<components.ImportRoleExportsStartResp>(`/internal/import/role_exports/start`, req)
}

/**
 * @description 
 * @param req
 */
export function internalImportRoleExportsStatus(req: components.ImportRoleExportsStatusReq) {
	return arcaWebapi.post<components.ImportRoleExportsStatusResp>(`/internal/import/role_exports/status`, req)
}

/**
 * @description 
 * @param req
 */
export function rechargeCreate(req: components.RechargeCreateReq) {
	return arcaWebapi.post<components.RechargeCreateResp>(`/pay/recharge/create`, req)
}

/**
 * @description 
 * @param params
 */
export function rechargeOrderDetail(params: components.RechargeOrderDetailReqParams) {
	return arcaWebapi.get<components.RechargeOrderDetailResp>(`/pay/recharge/order`, params)
}

/**
 * @description 
 * @param params
 */
export function rechargeOrders(params: components.RechargeOrdersReqParams) {
	return arcaWebapi.get<components.RechargeOrdersResp>(`/pay/recharge/orders`, params)
}

/**
 * @description 
 */
export function rechargePackages() {
	return arcaWebapi.get<components.RechargePackagesResp>(`/pay/recharge/packages`)
}

/**
 * @description 
 * @param params
 */
export function rechargeRefunds(params: components.RechargeRefundsReqParams) {
	return arcaWebapi.get<components.RechargeRefundsResp>(`/pay/recharge/refunds`, params)
}

/**
 * @description 
 * @param req
 */
export function rechargeVerify(req: components.RechargeVerifyReq) {
	return arcaWebapi.post<components.RechargeVerifyResp>(`/pay/recharge/verify`, req)
}

/**
 * @description 
 */
export function walletFreeQuotas() {
	return arcaWebapi.get<components.FreeQuotasResp>(`/wallet/free_quotas`)
}

/**
 * @description 
 */
export function walletInfo() {
	return arcaWebapi.get<components.WalletInfoResp>(`/wallet/info`)
}

/**
 * @description 
 * @param req
 */
export function walletTransactions(req: components.WalletTransactionsReq) {
	return arcaWebapi.post<components.WalletTransactionsResp>(`/wallet/transactions`, req)
}

/**
 * @description 
 * @param req
 */
export function deleteUserEmoji(req: components.DeleteUserEmojiReq) {
	return arcaWebapi.post<components.DeleteUserEmojiResp>(`/emoji/delete`, req)
}

/**
 * @description 
 * @param req
 */
export function markEmojiUsed(req: components.MarkEmojiUsedReq) {
	return arcaWebapi.post<components.MarkEmojiUsedResp>(`/emoji/mark_used`, req)
}

/**
 * @description 
 */
export function listEmojiPanel() {
	return arcaWebapi.post<components.ListEmojiPanelResp>(`/emoji/panel`)
}

/**
 * @description 
 * @param req
 */
export function uploadUserEmoji(req: components.UploadUserEmojiReq) {
	return arcaWebapi.post<components.UploadUserEmojiResp>(`/emoji/upload`, req)
}

/**
 * @description 
 */
export function getMusicList() {
	return arcaWebapi.get<components.ListMusicResp>(`/resource/music_list`)
}

/**
 * @description 
 * @param req
 */
export function addFriendFromAnonymousChat(req: components.AnonymousAddFriendReq) {
	return arcaWebapi.post<components.AnonymousAddFriendResp>(`/anonymous_chat/add_friend`, req)
}

/**
 * @description 
 */
export function getMyAnonymousTags() {
	return arcaWebapi.post<components.MyAnonymousTagsResp>(`/anonymous_chat/my_tags/get`)
}

/**
 * @description 
 * @param req
 */
export function setMyAnonymousTags(req: components.SetMyAnonymousTagsReq) {
	return arcaWebapi.post<components.MyAnonymousTagsResp>(`/anonymous_chat/my_tags/set`, req)
}

/**
 * @description 
 * @param req
 */
export function randomMatchCharacter(req: components.RandomMatchCharacterReq) {
	return arcaWebapi.post<components.RandomMatchCharacterResp>(`/anonymous_chat/random_match`, req)
}

/**
 * @description 
 * @param req
 */
export function sendMessageToAnonymousCharacter(req: components.SendMessageToAnonymousCharacterReq) {
	return arcaWebapi.post<components.SendMessageToAnonymousCharacterResp>(`/anonymous_chat/send_message`, req)
}

/**
 * @description 
 * @param params
 */
export function getChatPreference(params: components.GetChatPreferenceReqParams) {
	return arcaWebapi.get<components.GetChatPreferenceResp>(`/character_save/chat_preference`, params)
}

/**
 * @description 
 * @param req
 */
export function setChatPreference(req: components.SetChatPreferenceReq) {
	return arcaWebapi.post<components.SetChatPreferenceResp>(`/character_save/chat_preference/set`, req)
}

/**
 * @description 
 * @param req
 */
export function createComment(req: components.CreateCommentReq) {
	return arcaWebapi.post<components.CreateCommentResp>(`/comment/create`, req)
}

/**
 * @description 
 * @param req
 */
export function deleteComment(req: components.DeleteCommentReq) {
	return arcaWebapi.post<components.DeleteCommentResp>(`/comment/delete`, req)
}

/**
 * @description 
 * @param req
 */
export function listCommentsByPost(req: components.ListCommentsByPostReq) {
	return arcaWebapi.post<components.ListCommentsByPostResp>(`/comment/list_by_post`, req)
}

/**
 * @description 
 * @param req
 */
export function listRepliesByComment(req: components.ListRepliesByCommentReq) {
	return arcaWebapi.post<components.ListRepliesByCommentResp>(`/comment/list_replies`, req)
}

/**
 * @description 
 * @param req
 */
export function addFriend(req: components.AddFriendReq) {
	return arcaWebapi.post<components.AddFriendResp>(`/friendship/add`, req)
}

/**
 * @description 
 * @param req
 */
export function listFriendship(req: components.ListFriendshipReq) {
	return arcaWebapi.post<components.ListFriendshipResp>(`/friendship/list`, req)
}

/**
 * @description 
 * @param req
 */
export function removeFriend(req: components.RemoveFriendReq) {
	return arcaWebapi.post<components.RemoveFriendResp>(`/friendship/remove`, req)
}

/**
 * @description 
 * @param req
 */
export function updateFriendSaveVersion(req: components.UpdateFriendSaveVersionReq) {
	return arcaWebapi.post<components.UpdateFriendSaveVersionResp>(`/friendship/update_save_version`, req)
}

/**
 * @description 
 * @param req
 */
export function createPost(req: components.CreatePostReq) {
	return arcaWebapi.post<components.CreatePostResp>(`/post/create`, req)
}

/**
 * @description 
 * @param req
 */
export function deletePost(req: components.DeletePostReq) {
	return arcaWebapi.post<components.DeletePostResp>(`/post/delete`, req)
}

/**
 * @description 
 * @param req
 */
export function getPostDetail(req: components.GetPostDetailReq) {
	return arcaWebapi.post<components.GetPostDetailResp>(`/post/detail`, req)
}

/**
 * @description 
 * @param req
 */
export function listPostsByCharacter(req: components.ListPostsByCharacterReq) {
	return arcaWebapi.post<components.ListPostsByCharacterResp>(`/post/list_by_character`, req)
}

/**
 * @description 
 * @param req
 */
export function listMyDraftPosts(req: components.ListMyDraftPostsReq) {
	return arcaWebapi.post<components.ListMyDraftPostsResp>(`/post/list_drafts`, req)
}

/**
 * @description 
 * @param req
 */
export function listPublishedPosts(req: components.ListPublishedPostsReq) {
	return arcaWebapi.post<components.ListPublishedPostsResp>(`/post/list_published`, req)
}

/**
 * @description 
 * @param req
 */
export function publishPost(req: components.PublishPostReq) {
	return arcaWebapi.post<components.PublishPostResp>(`/post/publish`, req)
}

/**
 * @description 
 * @param req
 */
export function updatePostVisibility(req: components.UpdatePostVisibilityReq) {
	return arcaWebapi.post<components.UpdatePostVisibilityResp>(`/post/update_visibility`, req)
}

/**
 * @description 
 * @param req
 */
export function addReaction(req: components.ReactionAddReq) {
	return arcaWebapi.post<components.ReactionAddResp>(`/reaction/add`, req)
}

/**
 * @description 
 * @param req
 */
export function getReactionForTarget(req: components.GetReactionForTargetReq) {
	return arcaWebapi.post<components.GetReactionForTargetResp>(`/reaction/get_for_target`, req)
}

/**
 * @description 
 * @param req
 */
export function removeReaction(req: components.ReactionRemoveReq) {
	return arcaWebapi.post<components.ReactionRemoveResp>(`/reaction/remove`, req)
}

/**
 * @description 
 * @param req
 */
export function storyComment(req: components.StoryCommentReq) {
	return arcaWebapi.post<components.StoryCommentResp>(`/story/comment`, req)
}

/**
 * @description 
 * @param req
 */
export function storyCreate(req: components.StoryCreateReq) {
	return arcaWebapi.post<components.StoryCreateResp>(`/story/create`, req)
}

/**
 * @description 
 */
export function storyHeadline() {
	return arcaWebapi.get<components.StoryHeadlineResp>(`/story/headline`)
}

/**
 * @description 
 * @param req
 */
export function storyLike(req: components.StoryLikeReq) {
	return arcaWebapi.post<components.StoryLikeResp>(`/story/like`, req)
}

/**
 * @description 
 * @param req
 */
export function storyViewMark(req: components.StoryViewMarkReq) {
	return arcaWebapi.post<components.StoryViewMarkResp>(`/story/view/mark`, req)
}

/**
 * @description 
 * @param params
 */
export function storyViewer(params: components.StoryViewerReqParams) {
	return arcaWebapi.get<components.StoryViewerResp>(`/story/viewer`, params)
}

/**
 * @description 
 * @param req
 */
export function applyUserPersona(req: components.ApplyUserPersonaReq) {
	return arcaWebapi.post<components.ApplyUserPersonaResp>(`/character_save/apply_persona`, req)
}

/**
 * @description 
 * @param req
 */
export function createUserPersona(req: components.CreateUserPersonaReq) {
	return arcaWebapi.post<components.CreateUserPersonaResp>(`/user_persona/create`, req)
}

/**
 * @description 
 * @param req
 */
export function deleteUserPersona(req: components.DeleteUserPersonaReq) {
	return arcaWebapi.post<components.DeleteUserPersonaResp>(`/user_persona/delete`, req)
}

/**
 * @description 
 */
export function listUserPersonas() {
	return arcaWebapi.post<components.ListUserPersonasResp>(`/user_persona/list`)
}

/**
 * @description 
 * @param req
 */
export function updateUserPersona(req: components.UpdateUserPersonaReq) {
	return arcaWebapi.post<components.UpdateUserPersonaResp>(`/user_persona/update`, req)
}
