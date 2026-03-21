import api, { unwrapApiResponse } from "./api";
import { createSavedPlace } from "./places";

import {
  ApiResponse,
  CreateLinkedSavedPlaceRequest,
  LinkExtractResult,
  SavedPlace,
} from "../types";

export async function extractLink(url: string): Promise<LinkExtractResult> {
  const response = await api.post<ApiResponse<LinkExtractResult>>("/api/links/extract", { url });
  return unwrapApiResponse(response);
}

export async function saveLinkedPlace(payload: CreateLinkedSavedPlaceRequest): Promise<SavedPlace> {
  return createSavedPlace({
    name: payload.name,
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    memo: payload.memo,
    categoryId: payload.categoryId,
    originalUrl: payload.sourceLink.originalUrl,
    platform: payload.sourceLink.platform,
    title: payload.sourceLink.title,
    thumbnailUrl: payload.sourceLink.thumbnailUrl,
  });
}
