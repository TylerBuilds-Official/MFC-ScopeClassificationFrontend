export interface SessionListItem {
  id:                 number
  erector_name_raw:   string | null
  job_number:         string | null
  job_name:           string | null
  source_file_name:   string | null
  status:             string | null
  total_extracted:    number | null
  total_classified:   number | null
  total_aligned:      number | null
  total_erector_only: number | null
  total_mfc_only:     number | null
  total_partial:      number | null
  created_at:         string | null
  completed_at:       string | null
}

export interface SessionListResponse {
  sessions: SessionListItem[]
  count:    number
}

export interface SessionDetail {
  session:       Record<string, unknown>
  match_summary: MatchSummary
}

export interface SessionProgress {
  session_id:       number
  status:           string
  is_active:        boolean
  erector_name_raw: string | null
  job_number:       string | null
  source_file_name: string | null
  total_extracted:  number | null
  total_classified: number | null
  total_aligned:    number | null
  total_erector_only: number | null
  total_mfc_only:   number | null
  total_partial:    number | null
  error_message:    string | null
}

export interface MatchSummary {
  Aligned:      number
  Partial:      number
  ErectorOnly:  number
  MfcOnly:      number
}
