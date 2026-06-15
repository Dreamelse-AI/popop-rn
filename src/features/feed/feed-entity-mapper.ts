/**
 * feed 推荐实体响应 → 首页 Feed UI 模型
 */
import type { RecPopopEntity } from '@/generated';

import type { HomeFeedCharacter, HomeFeedPost, HomeFeedPromo, FeedStreamItem } from './feed-types';

function isHttpUrl(value: string | undefined): value is string {
  return !!value && /^https?:\/\//.test(value);
}

function formatCharacterTags(tags: string[] | undefined): string {
  if (!tags?.length) return '';
  return tags.map(tag => (tag.startsWith('#') ? tag : `#${tag}`)).join('  ');
}

export function toRecPopopExcludeId(entity: RecPopopEntity): string | null {
  if (entity.entity_type === 'post' && entity.rec_post_entity) {
    return `post:${entity.rec_post_entity.post_id}`;
  }
  if (entity.entity_type === 'character' && entity.rec_character_entity) {
    return `character:${entity.rec_character_entity.character_id}`;
  }
  if (entity.entity_type === 'promo' && entity.rec_html_promo_entity) {
    return `html:${entity.rec_html_promo_entity.promo_id}`;
  }
  return null;
}

function mapPostEntity(entity: RecPopopEntity): HomeFeedPost | null {
  const post = entity.rec_post_entity;
  if (!post) return null;

  const imageUrl = post.images?.map(media => media?.url).find(isHttpUrl) ?? null;
  const characterId = post.author_type === 'character' ? post.author_id : post.author_id;

  return {
    postId: post.post_id,
    impressionId: entity.impression_id,
    characterId,
    characterName: post.author_name ?? '',
    characterAvatar: post.author_portrait?.url ?? '',
    content: post.body?.trim() || post.title?.trim() || '',
    imageUrl,
    likeCount: post.liked_count ?? 0,
    isLiked: post.is_liked ?? false,
  };
}

function mapCharacterEntity(entity: RecPopopEntity): HomeFeedCharacter | null {
  const character = entity.rec_character_entity;
  if (!character) return null;

  const image = character.appearance_media?.url ?? '';
  if (!isHttpUrl(image)) return null;

  return {
    characterId: character.character_id,
    impressionId: entity.impression_id,
    name: character.name ?? '',
    image,
    tags: formatCharacterTags(character.tags),
    desc: character.desc ?? '',
    rawTags: character.tags ?? [],
    likedCount: character.liked_count ?? 0,
    recType: character.rec_type,
  };
}

function mapPromoEntity(entity: RecPopopEntity): HomeFeedPromo | null {
  const promo = entity.rec_html_promo_entity;
  if (!promo?.promo_id || !promo.html_content) return null;

  return {
    promoId: promo.promo_id,
    impressionId: entity.impression_id,
    htmlContent: promo.html_content,
    coverUrl: promo.cover_url,
    height: promo.height,
    jumpUrl: promo.jump_url,
    bgColor: promo.bg_color,
  };
}

type FeedEntitiesResp = {
  entities?: RecPopopEntity[];
};

export function mapFeedEntities(resp: FeedEntitiesResp): {
  stream: FeedStreamItem[];
  characters: HomeFeedCharacter[];
  excludeIds: string[];
} {
  const stream: FeedStreamItem[] = [];
  const characters: HomeFeedCharacter[] = [];
  const excludeIds: string[] = [];

  for (const entity of resp.entities ?? []) {
    const excludeId = toRecPopopExcludeId(entity);
    // 运营卡仅在真正曝光后写入 exclude_ids（见 markPromoShown）
    if (excludeId && entity.entity_type !== 'promo') {
      excludeIds.push(excludeId);
    }

    if (entity.entity_type === 'post') {
      const post = mapPostEntity(entity);
      if (post) stream.push({ type: 'post', post });
      continue;
    }

    if (entity.entity_type === 'promo') {
      const promo = mapPromoEntity(entity);
      if (promo) stream.push({ type: 'promo', promo });
      continue;
    }

    if (entity.entity_type === 'character') {
      const character = mapCharacterEntity(entity);
      if (character) characters.push(character);
    }
  }

  return { stream, characters, excludeIds };
}
