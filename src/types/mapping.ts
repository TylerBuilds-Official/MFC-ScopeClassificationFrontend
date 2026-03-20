// ── Erector exclusion with nested MFC mapping links ─────────

export interface MfcMappingLink {
  link_id:           number
  mfc_exclusion_id:  number
  mfc_exclusion:     string
  mfc_category_id:   number
  mfc_category_name: string
  created_by:        string
  created_at:        string
}

export interface ErectorExclusionItem {
  Id:               number
  ErectorId:        number
  ErectorName:      string
  ErectorShortName: string
  CategoryId:       number
  CategoryName:     string
  Exclusion:        string
  IsStandard:       boolean
  ItemType:         string
  Disposition:      string
  MappedBy:         string | null
  MappedAt:         string | null
  Notes:            string | null
  mappings:         MfcMappingLink[]
}

export interface ErectorExclusionListResponse {
  items: ErectorExclusionItem[]
  count: number
}


// ── MFC dropdown options ────────────────────────────────────

export interface MfcOption {
  Id:           number
  Exclusion:    string
  CategoryId:   number
  CategoryName: string
  ScopeType:    string
}

export interface MfcOptionListResponse {
  items: MfcOption[]
  count: number
}


// ── Disposition update ──────────────────────────────────────

export type Disposition =
  | 'Unmapped'
  | 'Mapped'
  | 'PMReportOnly'


// ── Link responses ──────────────────────────────────────────

export interface CreateLinkResponse {
  Id:                  number
  ErectorExclusionId:  number
  MfcExclusionId:      number
  CreatedBy:           string
  CreatedAt:           string
}

export interface DeleteLinkResponse {
  deleted:         number
  remaining_links: number
}

export interface BulkLinkResponse {
  mfc_exclusion_id: number
  links_created:    number
  links_skipped:    number
  total_mapped:     number
}


// ── Stats ───────────────────────────────────────────────────

export interface MappingStats {
  total:          number
  by_disposition: Record<string, number>
  by_erector:     Record<string, Record<string, number>>
}
