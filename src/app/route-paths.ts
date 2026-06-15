/** 角色详情页 / 落地页（推荐流等入口） */
export function characterDetailPath(characterId: string) {
  return `/character-detail/${encodeURIComponent(characterId)}`;
}

/** 角色主页（聊天页头像等入口，Figma 625:5346） */
export function characterProfilePath(characterId: string) {
  return `/character/${encodeURIComponent(characterId)}`;
}

export function characterChatPath(characterId: string) {
  return `/chat/${encodeURIComponent(characterId)}`;
}
