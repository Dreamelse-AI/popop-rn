import { arcaWebapi } from '@/shared/api/arca-webapi';

export type MusicMedia = {
  url?: string;
  media_type?: string;
  id?: string;
  name?: string;
};

export type MusicInfo = {
  music_key: string;
  title?: string;
  media?: MusicMedia;
};

let cache: MusicInfo[] | null = null;
let inflight: Promise<MusicInfo[]> | null = null;

type RawMusicInfo = {
  music_key?: string;
  MusicKey?: string;
  key?: string;
  title?: string;
  Title?: string;
  name?: string;
  Name?: string;
  media?: MusicMedia;
  Media?: MusicMedia;
};

type RawListMusicResp = {
  recent?: RawMusicInfo[];
  musics?: RawMusicInfo[];
  Musics?: RawMusicInfo[];
  list?: RawMusicInfo[];
};

function normalizeMusicInfo(raw: RawMusicInfo): MusicInfo | null {
  const music_key = raw.music_key?.trim() || raw.MusicKey?.trim() || raw.key?.trim();
  if (!music_key) return null;

  return {
    music_key,
    title:
      raw.title?.trim() ||
      raw.Title?.trim() ||
      raw.name?.trim() ||
      raw.Name?.trim() ||
      undefined,
    media: raw.media ?? raw.Media,
  };
}

/** 兼容 recent / musics 等后端字段差异 */
export function parseMusicListResponse(resp: unknown): MusicInfo[] {
  if (Array.isArray(resp)) {
    return resp
      .map(item => normalizeMusicInfo(item as RawMusicInfo))
      .filter((item): item is MusicInfo => item !== null);
  }

  if (!resp || typeof resp !== 'object') return [];

  const obj = resp as RawListMusicResp;
  const candidates = [obj.recent, obj.musics, obj.Musics, obj.list];

  for (const arr of candidates) {
    if (!Array.isArray(arr)) continue;
    const normalized = arr
      .map(item => normalizeMusicInfo(item))
      .filter((item): item is MusicInfo => item !== null);
    if (normalized.length > 0) return normalized;
  }

  for (const arr of candidates) {
    if (!Array.isArray(arr)) continue;
    return arr
      .map(item => normalizeMusicInfo(item))
      .filter((item): item is MusicInfo => item !== null);
  }

  return [];
}

/** GET /resource/music_list — 待 gen:api 同步后可改用 generated getMusicList */
export async function fetchMusicList(force = false): Promise<MusicInfo[]> {
  if (!force && cache) return cache;

  if (!inflight || force) {
    if (force) {
      cache = null;
      inflight = null;
    }

    inflight = arcaWebapi
      .get<RawListMusicResp>('/resource/music_list')
      .then(resp => {
        const list = parseMusicListResponse(resp);
        cache = list;
        return list;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight ?? Promise.resolve([]);
}

export function resetMusicListCache(): void {
  cache = null;
  inflight = null;
}
