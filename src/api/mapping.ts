import { get, post, patch, del_ } from './client'
import type {
  ErectorExclusionListResponse,
  MfcOptionListResponse,
  MappingStats,
  CreateLinkResponse,
  DeleteLinkResponse,
  BulkLinkResponse,
  Disposition,
} from '../types/mapping'


// ── Erector exclusions (main feed) ──────────────────────────

export async function getErectorExclusions(filters?: {
  category_id?: number
  erector_id?:  number
  disposition?: string
}): Promise<ErectorExclusionListResponse> {

  const params: Record<string, string | number> = {}

  if (filters?.category_id) params.category_id = filters.category_id
  if (filters?.erector_id)  params.erector_id  = filters.erector_id
  if (filters?.disposition) params.disposition  = filters.disposition

  return get<ErectorExclusionListResponse>('/mapping/erector-exclusions', params)
}


// ── MFC options (dropdown data) ─────────────────────────────

export async function getMfcOptions(
  categoryId?: number,
): Promise<MfcOptionListResponse> {

  const params: Record<string, string | number> = {}
  if (categoryId) params.category_id = categoryId

  return get<MfcOptionListResponse>('/mapping/mfc-options', params)
}


// ── Disposition ─────────────────────────────────────────────

export async function updateDisposition(
  erectorExclusionId: number,
  disposition:        Disposition,
): Promise<{ erector_exclusion_id: number; disposition: string }> {

  return patch(`/mapping/erector-exclusions/${erectorExclusionId}/disposition`, { disposition })
}


// ── Notes ───────────────────────────────────────────────

export async function updateNotes(
  erectorExclusionId: number,
  notes:              string | null,
): Promise<{ erector_exclusion_id: number; notes: string | null }> {

  return patch(`/mapping/erector-exclusions/${erectorExclusionId}/notes`, { notes })
}


// ── Single link ─────────────────────────────────────────────

export async function createLink(
  erectorExclusionId: number,
  mfcExclusionId:     number,
): Promise<CreateLinkResponse> {

  return post('/mapping/links', {
    erector_exclusion_id: erectorExclusionId,
    mfc_exclusion_id:     mfcExclusionId,
  })
}


export async function deleteLink(linkId: number): Promise<DeleteLinkResponse> {

  return del_<DeleteLinkResponse>(`/mapping/links/${linkId}`)
}


// ── Bulk link ───────────────────────────────────────────────

export async function bulkLink(
  erectorExclusionIds: number[],
  mfcExclusionId:      number,
): Promise<BulkLinkResponse> {

  return post('/mapping/bulk-link', {
    erector_exclusion_ids: erectorExclusionIds,
    mfc_exclusion_id:      mfcExclusionId,
  })
}


// ── Stats ───────────────────────────────────────────────────

export async function getMappingStats(): Promise<MappingStats> {

  return get<MappingStats>('/mapping/stats')
}
