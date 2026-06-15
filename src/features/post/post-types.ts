export type PostImage = {
  url: string;
  width?: number;
  height?: number;
};

export type PostDetail = {
  post_id: string;
  character_id: string;
  character_name: string;
  character_avatar: string;
  content: string;
  images: PostImage[];
  bgm_url?: string;
  published_at: string;
  liked: boolean;
};
