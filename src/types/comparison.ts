// ── Comparison list ──────────────────────────────────────────────

export interface ComparisonListItem {
  id:                  number
  job_number:          string | null
  job_name:            string | null
  status:              string
  total_erectors:      number
  total_unified:       number
  initiated_by:        string | null
  created_at:          string | null
  erector_names:       string[]
  selected_session_id: number | null
}

export interface ComparisonListResponse {
  comparisons: ComparisonListItem[]
  count:       number
}


// ── Comparison detail ───────────────────────────────────────────

export interface ComparisonErector {
  AnalysisSessionId: number
  ErectorNameRaw:    string | null
  SortOrder:         number
  JobNumber:         string | null
  SourceFileName:    string | null
}

export interface CoverageCell {
  type:                   'Excludes' | 'Includes' | 'NotMentioned'
  raw:                    string | null
  extracted_exclusion_id: number | null
}

export interface UnifiedItem {
  id:          number
  description: string
  category_id: number | null
  category:    string | null
  sort_order:  number
  coverage:    Record<string, CoverageCell>  // keyed by analysis_session_id
}

export interface ComparisonSession {
  Id:                number
  JobNumber:         string | null
  JobName:           string | null
  InitiatedBy:       string | null
  Status:            string
  TotalErectors:     number
  TotalUnified:      number
  CreatedAt:         string | null
  CompletedAt:       string | null
  ErrorMessage:      string | null
  SelectedSessionId: number | null
  SelectedAt:        string | null
}

export interface ComparisonResult {
  comparison_session: ComparisonSession
  erectors:           ComparisonErector[]
  unified_items:      UnifiedItem[]
}


// ── Progress ────────────────────────────────────────────────────

export interface ComparisonProgress {
  comparison_id:       number
  status:              string
  is_active:           boolean
  current_phase:       string
  erectors_analyzed:   number
  total_erectors:      number
  total_unified:       number
  error_message:       string | null
  selected_session_id: number | null
}
