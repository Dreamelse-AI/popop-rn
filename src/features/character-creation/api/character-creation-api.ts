import type {
  CharacterCreateForm,
  CharacterDraftItem,
  DeleteCharacterDraftReq,
  DeleteCharacterDraftResp,
  DeleteCharacterReq,
  DeleteCharacterResp,
  GetCharacterDraftDetailReqParams,
  GetCharacterDraftDetailResp,
  ListCharacterDraftsResp,
  ListUserCharactersReq,
  ListUserCharactersResp,
  SaveCharacterDraftReq,
  SaveCharacterDraftResp,
  SubmitCharacterDraftReq,
  SubmitCharacterDraftResp,
} from '@/generated/arca_apiComponents';
import * as real from '@/generated/arca_api';

import { USE_CHARACTER_CREATION_MOCK } from '../config';
import { loadPublishedCharacterCreateForm as fetchPublishedCharacterCreateForm } from '../lib/load-published-character-form';
import * as mock from './character-creation-api.mock';

export type { GetCharacterDraftDetailReqParams, GetCharacterDraftDetailResp } from '@/generated/arca_apiComponents';

export function listCharacterDrafts(): Promise<ListCharacterDraftsResp> {
  return USE_CHARACTER_CREATION_MOCK ? mock.listCharacterDrafts() : real.listCharacterDrafts();
}

export function getCharacterDraftDetail(
  params: GetCharacterDraftDetailReqParams,
): Promise<GetCharacterDraftDetailResp> {
  return USE_CHARACTER_CREATION_MOCK
    ? mock.getCharacterDraftDetail(params)
    : real.getCharacterDraftDetail({ draft_id: params.draft_id });
}

export function listUserCharacters(req: ListUserCharactersReq): Promise<ListUserCharactersResp> {
  return USE_CHARACTER_CREATION_MOCK ? mock.listUserCharacters(req) : real.listUserCharacters(req);
}

export function saveCharacterDraft(req: SaveCharacterDraftReq): Promise<SaveCharacterDraftResp> {
  return USE_CHARACTER_CREATION_MOCK ? mock.saveCharacterDraft(req) : real.saveCharacterDraft(req);
}

export function deleteCharacterDraft(
  req: DeleteCharacterDraftReq,
): Promise<DeleteCharacterDraftResp> {
  return USE_CHARACTER_CREATION_MOCK
    ? mock.deleteCharacterDraft(req)
    : real.deleteCharacterDraft(req);
}

export function submitCharacterDraft(
  req: SubmitCharacterDraftReq,
): Promise<SubmitCharacterDraftResp> {
  return USE_CHARACTER_CREATION_MOCK
    ? mock.submitCharacterDraft(req)
    : real.submitCharacterDraft(req);
}

export function deleteCharacter(req: DeleteCharacterReq): Promise<DeleteCharacterResp> {
  return USE_CHARACTER_CREATION_MOCK ? mock.deleteCharacter(req) : real.deleteCharacter(req);
}

export function getPublishedCharacterCreateForm(
  characterId: string,
): Promise<CharacterCreateForm> {
  return fetchPublishedCharacterCreateForm(characterId);
}

export { USE_CHARACTER_CREATION_MOCK };
