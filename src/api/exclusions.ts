import { get, post, put, del_ } from './client'
import type { MfcExclusionListResponse, MfcExclusion } from '../types/exclusion'


export async function getMfcExclusions(categoryId?: number): Promise<MfcExclusionListResponse> {

  const params: Record<string, string | number> = {}
  if (categoryId != null) params.category_id = categoryId

  return get<MfcExclusionListResponse>('/exclusions/mfc', params)
}


export async function getMfcExclusion(id: number): Promise<MfcExclusion> {

  return get<MfcExclusion>(`/exclusions/mfc/${id}`)
}


export async function createMfcExclusion(data: {
  category_id: number
  exclusion:   string
  item_type?:  string
  sort_order?: number
}): Promise<MfcExclusion> {

  return post<MfcExclusion>('/exclusions/mfc', data)
}


export async function updateMfcExclusion(id: number, data: {
  category_id?: number
  exclusion?:   string
  item_type?:   string
  sort_order?:  number
}): Promise<MfcExclusion> {

  return put<MfcExclusion>(`/exclusions/mfc/${id}`, data)
}


export async function deleteMfcExclusion(id: number): Promise<{ deleted: number }> {

  return del_<{ deleted: number }>(`/exclusions/mfc/${id}`)
}
