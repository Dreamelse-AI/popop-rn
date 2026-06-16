import type {
  CharacterDetailInfo,
  CharacterSchedule,
  CharacterStatus,
  EmojiItem,
} from '@/generated/arca_apiComponents';
import { toEpochMs } from '@/shared/lib/epoch-ms';

import type { ChatCharacter } from '../model/types';

export function resolveCharacterAvatar(character: CharacterDetailInfo): string {
  if (character.splash_img?.url) return character.splash_img.url;

  const outfit =
    character.outfits?.find(item => item.outfit_id === character.current_outfit_id) ??
    character.outfits?.find(item => item.in_use) ??
    character.outfits?.[0];

  const appearance =
    outfit?.appearances.find(item => item.appearance_id === character.current_appearance_id) ??
    outfit?.appearances.find(item => item.in_use) ??
    outfit?.appearances[0];

  return appearance?.image.url ?? '';
}

export function mapCharacterDetailToChatCharacter(
  character: CharacterDetailInfo,
): ChatCharacter {
  return {
    id: character.character_id,
    name: character.name ?? character.aka ?? '角色',
    avatar: resolveCharacterAvatar(character),
    sceneTag: '',
  };
}

export function buildEmojiDescriptionMap(emojis: EmojiItem[]): Map<string, string> {
  return new Map(emojis.map(item => [item.emoji_id, getEmojiLabel(item)]));
}

export function getEmojiLabel(emoji: EmojiItem): string {
  const name = emoji.name?.trim();
  if (name) return name;

  const media = emoji.media;
  return (
    media.desc?.trim() ||
    media.text?.trim() ||
    media.name?.trim() ||
    '表情包'
  );
}

function parseScheduleTime(value?: number): number | null {
  if (value == null || value <= 0) return null;
  return toEpochMs(value);
}

/** 取当前时刻对应的日程，用于初始化顶栏角色状态标签 */
export function pickCurrentSchedule(
  schedules: CharacterSchedule[],
  now = Date.now(),
): CharacterSchedule | undefined {
  if (schedules.length === 0) return undefined;

  const active = schedules.find(schedule => {
    const start = parseScheduleTime(schedule.schedule_start_time);
    const end = parseScheduleTime(schedule.schedule_end_time);
    if (start === null || end === null) return false;
    return now >= start && now <= end;
  });

  return active ?? schedules[schedules.length - 1];
}

export function scheduleToCharacterStatus(schedule: CharacterSchedule): CharacterStatus {
  return {
    character_state: schedule.character_state,
    character_loc: schedule.character_loc,
    character_loc_bkg: schedule.character_loc_bkg,
    current_outfit_id: schedule.current_outfit_id,
    current_appearance_name: schedule.current_appearance_name,
  };
}
