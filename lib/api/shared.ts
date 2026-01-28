import { apiClient } from "./client";
import { getOptions } from "./user";

export type SharedType = "conversation" | "annotation" | (string & {});

export interface SharedResponse {
  id: string;
  created_at: string;
  updated_at: string;
  type: SharedType;
  ref: string;
  shared_by?: string;
}

export interface SharedCreateRequest {
  type: SharedType;
  ref: string;
}

export interface SharedUpdateRequest {
  type?: SharedType;
  ref?: string;
}

export interface ListSharedParams {
  limit?: number;
  offset?: number;
  /**
   * Optional bearer token. If provided, sent as `Authorization: Bearer <token>`.
   * Note: the underlying API may additionally require the `X-API-KEY`.
   */
  authToken?: string;
  signal?: AbortSignal;
}

export const getShared = async (
  sharedId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<SharedResponse> => {
  const encoded = encodeURIComponent(sharedId);
  return apiClient.get<SharedResponse>(`shared/${encoded}`, getOptions({ signal: opts.signal }));
};

export const listShared = async (params: ListSharedParams = {}): Promise<SharedResponse[]> => {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const qs = query.toString();
  const path = qs ? `shared?${qs}` : "shared";
  return apiClient.get<SharedResponse[]>(path, getOptions({ authToken: params.authToken, signal: params.signal }));
};

export const createShared = async (
  body: SharedCreateRequest,
  opts: { authToken?: string; signal?: AbortSignal } = {},
): Promise<SharedResponse> => apiClient.post<SharedResponse>("shared", body, getOptions({ authToken: opts.authToken, signal: opts.signal }));

export const updateShared = async (
  sharedId: string,
  body: SharedUpdateRequest,
  opts: { authToken?: string; signal?: AbortSignal } = {},
): Promise<SharedResponse> => {
  const encoded = encodeURIComponent(sharedId);
  return apiClient.patch<SharedResponse>(`shared/${encoded}`, body, getOptions({ authToken: opts.authToken, signal: opts.signal }));
};

export const deleteShared = async (
  sharedId: string,
  opts: { authToken?: string; signal?: AbortSignal } = {},
): Promise<void> => {
  const encoded = encodeURIComponent(sharedId);
  await apiClient.delete<void>(`shared/${encoded}`, getOptions({ authToken: opts.authToken, signal: opts.signal }));
};


