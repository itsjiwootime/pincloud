export type VisitStatus = "WANT" | "VISITED";
export type Platform = "INSTAGRAM" | "YOUTUBE" | "BLOG" | "OTHER";
export type ContentType = "SINGLE_PLACE" | "MULTI_PLACE" | "REVIEW_REQUIRED";

export interface User {
  id: number;
  email: string;
  nickname: string;
}

export interface Category {
  id: number;
  name: string;
  colorCode: string;
  createdAt?: string;
}

export interface SourceLink {
  id: number;
  originalUrl: string;
  platform: Platform;
  title?: string;
  thumbnailUrl?: string;
}

export interface SourceLinkPayload {
  originalUrl: string;
  platform: Platform;
  title?: string;
  thumbnailUrl?: string;
}

export interface SavedPlace {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  memo?: string;
  visitStatus: VisitStatus;
  category?: Category;
  sourceLinks?: SourceLink[];
  createdAt: string;
}

export interface PlaceCandidate {
  rawName: string;
  normalizedName?: string;
  matchedName?: string;
  roadAddress?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  kakaoMatched: boolean;
  regionHint?: string;
  categoryHint?: string;
  kakaoCategory?: string;
}

export interface LinkExtractResult {
  platform: Platform;
  originalUrl: string;
  title?: string;
  thumbnailUrl?: string;
  contentType: ContentType;
  topCandidates: PlaceCandidate[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  nickname: string;
}

export type KakaoLoginResponse = AuthResponse;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface CategoryPayload {
  name: string;
  colorCode: string;
}

export interface SavedPlaceApiDto {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  memo?: string | null;
  visitStatus: VisitStatus;
  categoryId?: number | null;
  categoryName?: string | null;
  colorCode?: string | null;
  originalUrl?: string | null;
  platform?: Platform | null;
  thumbnailUrl?: string | null;
  createdAt: string;
}

export interface CreateSavedPlaceRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  memo?: string;
  categoryId?: number;
  originalUrl: string;
  platform?: Platform;
  title?: string;
  thumbnailUrl?: string;
}

export interface CreateLinkedSavedPlaceRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  memo?: string;
  categoryId?: number;
  visitStatus?: VisitStatus;
  sourceLink: SourceLinkPayload;
}

export interface UpdateSavedPlaceRequest {
  categoryId?: number | null;
  memo?: string | null;
  visitStatus?: VisitStatus;
}
