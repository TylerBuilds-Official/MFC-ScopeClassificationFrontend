export interface ActionItem {
  id:            number
  session_id:    number
  match_id:      number | null
  section:       string
  status:        string
  notes:         string | null
  created_at:    string | null
  updated_at:    string | null
  erector_text:  string | null
  mfc_text:      string | null
  match_type:    string | null
  confidence:    number | null
  risk_level:    string | null
  risk_notes:    string | null
  ai_reasoning:  string | null
  category_id:   number | null
  mfc_exclusion_id: number | null
  mfc_item_type:    string | null
}

export interface ActionItemSummary {
  total:        number
  unreviewed:   number
  acknowledged: number
  addressed:    number
  dismissed:    number
  by_section:   Record<string, number>
}

export interface ActionItemListResponse {
  session_id: number
  items:      ActionItem[]
  summary:    ActionItemSummary
}
