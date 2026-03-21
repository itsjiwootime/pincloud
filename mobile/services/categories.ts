import api, { unwrapApiResponse } from "./api";

import { ApiResponse, Category, CategoryPayload } from "../types";

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>("/api/categories");
  return unwrapApiResponse(response);
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const response = await api.post<ApiResponse<Category>>("/api/categories", payload);
  return unwrapApiResponse(response);
}

export async function updateCategory(id: number, payload: CategoryPayload): Promise<Category> {
  const response = await api.put<ApiResponse<Category>>(`/api/categories/${id}`, payload);
  return unwrapApiResponse(response);
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<null>>(`/api/categories/${id}`);
  unwrapApiResponse(response);
}
