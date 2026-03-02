import { get, patch } from './client'
import type { SessionListResponse, SessionDetail, SessionProgress } from '../types/session'


export async function getSessions(
  limit  = 50,
  offset = 0,
  status?: string,
): Promise<SessionListResponse> {

  const params: Record<string, string | number> = { limit, offset }
  if (status) params.status = status

  return get<SessionListResponse>('/sessions', params)
}


export async function getSession(id: number): Promise<SessionDetail> {

  return get<SessionDetail>(`/sessions/${id}`)
}


export async function getSessionProgress(id: number): Promise<SessionProgress> {

  return get<SessionProgress>(`/sessions/${id}/progress`)
}


export async function updateSession(
  id:   number,
  data: Record<string, unknown>,
): Promise<{ updated: number }> {

  return patch<{ updated: number }>(`/sessions/${id}`, data)
}
