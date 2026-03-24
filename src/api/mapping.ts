import { get, post, patch, del_ } from './client'
import type {
  AtomicExclusionListResponse,
  MfcOptionListResponse,
  ErectorListResponse,
  MappingStats,
  CreateLinkResponse,
  DeleteLinkResponse,
  BulkLinkResponse,
  Disposition,
} from '../types/mapping'


// ── Atomic exclusions (main feed) ───────────────────────────

export async function getAtomicExclusions(filters?: {
  erector_id?:  number
  disposition?: string
}): Promise<AtomicExclusionListResponse> {

  const params: Record<string, string | number> = {}

  if (filters?.erector_id)  params.erector_id  = filters.erector_id
  if (filters?.disposition) params.disposition  = filters.disposition

  return get<AtomicExclusionListResponse>('/mapping/atomic-exclusions', params)
}


// ── MFC options (dropdown data) ─────────────────────────────

export async function getMfcOptions(
  categoryId?: number,
): Promise<MfcOptionListResponse> {

  const params: Record<string, string | number> = {}
  if (categoryId) params.category_id = categoryId

  return get<MfcOptionListResponse>('/mapping/mfc-options', params)
}


// ── Erectors (filter data) ──────────────────────────────────

export async function getErectors(): Promise<ErectorListResponse> {

  return get<ErectorListResponse>('/mapping/erectors')
}


// ── Disposition ─────────────────────────────────────────────

export async function updateDisposition(
  atomicExclusionId: number,
  disposition:       Disposition,
): Promise<{ atomic_exclusion_id: number; disposition: string }> {

  return patch(`/mapping/atomic-exclusions/${atomicExclusionId}/disposition`, { disposition })
}


// ── Notes ───────────────────────────────────────────────────

export async function updateNotes(
  atomicExclusionId: number,
  notes:             string | null,
): Promise<{ atomic_exclusion_id: number; notes: string | null }> {

  return patch(`/mapping/atomic-exclusions/${atomicExclusionId}/notes`, { notes })
}


// ── Single link ─────────────────────────────────────────────

export async function createLink(
  atomicExclusionId: number,
  mfcExclusionId:    number,
): Promise<CreateLinkResponse> {

  return post('/mapping/links', {
    atomic_exclusion_id: atomicExclusionId,
    mfc_exclusion_id:    mfcExclusionId,
  })
}


export async function deleteLink(linkId: number): Promise<DeleteLinkResponse> {

  return del_<DeleteLinkResponse>(`/mapping/links/${linkId}`)
}


// ── Bulk link ───────────────────────────────────────────────

export async function bulkLink(
  atomicExclusionIds: number[],
  mfcExclusionId:     number,
): Promise<BulkLinkResponse> {

  return post('/mapping/bulk-link', {
    atomic_exclusion_ids: atomicExclusionIds,
    mfc_exclusion_id:     mfcExclusionId,
  })
}


// ── Stats ───────────────────────────────────────────────────

export async function getMappingStats(): Promise<MappingStats> {

  return get<MappingStats>('/mapping/stats')
}
