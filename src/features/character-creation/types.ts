export type CreationListTab = 'draft' | 'published';

export type CreationCharacterItem = {
  id: string;
  name: string;
  coverUrl: string | null;
  status: CreationListTab;
  updatedAt: number;
};

export type CreationCharacterList = {
  drafts: CreationCharacterItem[];
  published: CreationCharacterItem[];
};
