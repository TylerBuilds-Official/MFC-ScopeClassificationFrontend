// ── Source erector info ──────────────────────────────────────

export interface SourceErector {
  erector_id:         number
  erector_short_name: string
}


// ── Atomic exclusion with nested MFC mapping links ──────────

export interface MfcMappingLink {
  link_id:           number
  mfc_exclusion_id:  number
  mfc_exclusion:     string
  mfc_category_id:   number
  mfc_category_name: string
  created_at:        string
}

export interface AtomicExclusionItem {
  Id:           number
  Exclusion:    string
  CategoryId:   number | null
  CategoryName: string | null
  ItemType:     string
  ScopeType:    string
  Disposition:  string
  MappedBy:     string | null
  MappedAt:     string | null
  Notes:        string | null
  sources:      SourceErector[]
  mappings:     MfcMappingLink[]
}

export interface AtomicExclusionListResponse {
  items: AtomicExclusionItem[]
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


// ── Erector list (for filter) ───────────────────────────────

export interface ErectorOption {
  Id:        number
  ShortName: string
}

export interface ErectorListResponse {
  items: ErectorOption[]
}


// ── Disposition update ──────────────────────────────────────

export type Disposition =
  | 'Unmapped'
  | 'Mapped'
  | 'PMReportOnly'


// ── Link responses ──────────────────────────────────────────

export interface CreateLinkResponse {
  Id:                 number
  AtomicExclusionId:  number
  MfcExclusionId:     number
  CreatedAt:          string
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
