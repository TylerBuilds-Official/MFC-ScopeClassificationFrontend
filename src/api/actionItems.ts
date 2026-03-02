import { get, patch, post } from './client'
import type { ActionItemListResponse } from '../types/actionItem'


export async function getSessionActionItems(sessionId: number): Promise<ActionItemListResponse> {

  return get<ActionItemListResponse>(`/action-items/session/${sessionId}`)
}


export async function updateActionItem(
  itemId: number,
  data:   { status?: string; notes?: string },
): Promise<{ updated: number }> {

  return patch<{ updated: number }>(`/action-items/${itemId}`, data)
}


export async function batchUpdateActionItems(
  itemIds: number[],
  status:  string,
): Promise<{ updated: number; status: string }> {

  return patch<{ updated: number; status: string }>('/action-items/batch', {
    item_ids: itemIds,
    status,
  })
}


export async function generateActionItems(
  sessionId: number,
): Promise<{ session_id: number; generated: number }> {

  return post<{ session_id: number; generated: number }>(
    `/action-items/session/${sessionId}/generate`,
    {},
  )
}
