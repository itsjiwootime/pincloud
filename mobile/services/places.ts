import api, { unwrapApiResponse } from "./api";
import { DEFAULT_PIN_COLOR } from "../constants/config";

import {
  ApiResponse,
  CreateSavedPlaceRequest,
  SavedPlace,
  SavedPlaceApiDto,
  SourceLink,
  UpdateSavedPlaceRequest,
} from "../types";

function mapSavedPlace(dto: SavedPlaceApiDto): SavedPlace {
  const category =
    dto.categoryId && dto.categoryName
      ? {
          id: dto.categoryId,
          name: dto.categoryName,
          colorCode: dto.colorCode ?? DEFAULT_PIN_COLOR,
        }
      : undefined;

  const sourceLinks: SourceLink[] | undefined = dto.originalUrl
    ? [
        {
          id: dto.id,
          originalUrl: dto.originalUrl,
          platform: dto.platform ?? "OTHER",
          thumbnailUrl: dto.thumbnailUrl ?? undefined,
        },
      ]
    : undefined;

  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    latitude: dto.latitude,
    longitude: dto.longitude,
    memo: dto.memo ?? undefined,
    visitStatus: dto.visitStatus,
    category,
    sourceLinks,
    createdAt: dto.createdAt,
  };
}

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  const response = await api.get<ApiResponse<SavedPlaceApiDto[]>>("/api/saved-places");
  return unwrapApiResponse(response).map(mapSavedPlace);
}

export async function getSavedPlacesByBbox(bbox: string): Promise<SavedPlace[]> {
  const response = await api.get<ApiResponse<SavedPlaceApiDto[]>>("/api/saved-places", {
    params: { bbox },
  });
  return unwrapApiResponse(response).map(mapSavedPlace);
}

export async function getSavedPlace(id: number | string): Promise<SavedPlace> {
  const response = await api.get<ApiResponse<SavedPlaceApiDto>>(`/api/saved-places/${id}`);
  return mapSavedPlace(unwrapApiResponse(response));
}

export async function createSavedPlace(payload: CreateSavedPlaceRequest): Promise<SavedPlace> {
  const response = await api.post<ApiResponse<SavedPlaceApiDto>>("/api/saved-places", payload);
  return mapSavedPlace(unwrapApiResponse(response));
}

export async function updateSavedPlace(
  id: number | string,
  payload: UpdateSavedPlaceRequest
): Promise<SavedPlace> {
  const response = await api.patch<ApiResponse<SavedPlaceApiDto>>(
    `/api/saved-places/${id}`,
    payload
  );
  return mapSavedPlace(unwrapApiResponse(response));
}

export async function deleteSavedPlace(id: number | string): Promise<void> {
  const response = await api.delete<ApiResponse<null>>(`/api/saved-places/${id}`);
  unwrapApiResponse(response);
}
