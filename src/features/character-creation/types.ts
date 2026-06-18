export type CreationListTab = 'draft' | 'published';

export type CreationCharacterItem = {
  id: string;
  name: string;
  coverUrl: string | null;
  status: CreationListTab;
  draftAuditStatus?: string;
  /** 最近更新时间（毫秒） */
  updatedAt: number;
};

export type CreationCharacterList = {
  drafts: CreationCharacterItem[];
  published: CreationCharacterItem[];
};
