export interface Post {
  id: string;
  content: string;
  hashtags: string[];
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  viewsCount: number;
  authorAnonymousId: string;
  userReaction: string | null;
  topComment: TopComment | null;
}

export interface TopComment {
  id: string;
  content: string;
  authorAnonymousId: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
}

export interface PostDetail {
  id: string;
  content: string;
  hashtags: string[];
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  viewsCount: number;
  authorAnonymousId: string;
  userReaction: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  content: string;
  authorAnonymousId: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  userReaction?: string | null;
}

export interface User {
  id: string;
  anonymousId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
