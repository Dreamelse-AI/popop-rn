import type { RandomMatchCharacterReq } from '@/generated/arca_apiComponents';

type MatchPreferenceInput = {
  tags: string[];
  personality: string;
  gender: string | null;
};

export function mapMatchGender(
  gender: string | null,
): RandomMatchCharacterReq['gender'] | undefined {
  if (!gender || gender === '不限') return undefined;
  if (gender === '男性' || gender === 'male') return 'male';
  if (gender === '女性' || gender === 'female') return 'female';
  if (gender === '其他' || gender === 'other' || gender === 'non-human') return 'other';
  return undefined;
}

export function buildRandomMatchRequest(pref: MatchPreferenceInput): RandomMatchCharacterReq {
  const tags = [...pref.tags];
  const personality = pref.personality.trim();
  if (personality && !tags.includes(personality)) {
    tags.push(personality);
  }

  const gender = mapMatchGender(pref.gender);

  return {
    tags: tags.length > 0 ? tags : ['随机'],
    ...(gender ? { gender } : {}),
  };
}
