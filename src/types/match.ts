export interface MatchRow {
  id:                       number
  session_id:               number
  extracted_exclusion_id:   number | null
  mfc_exclusion_id:         number | null
  category_id:              number | null
  match_type:               string | null
  confidence:               number | null
  ai_reasoning:             string | null
  risk_level:               string | null
  risk_notes:               string | null
  erector_text:             string | null
  mfc_text:                 string | null
  mfc_item_type:            string | null
}

export interface MatchListResponse {
  session_id: number
  matches:    MatchRow[]
  count:      number
}

/** Raw PascalCase shape returned by GET /api/matches/high-risk (unprocessed DB rows). */
export interface HighRiskMatchRaw {
  Id:                     number
  SessionId:              number
  ExtractedExclusionId:   number | null
  MfcExclusionId:         number | null
  CategoryId:             number | null
  MatchType:              string | null
  Confidence:             number | null
  AiReasoning:            string | null
  RiskLevel:              string | null
  RiskNotes:              string | null
  ErectorNameRaw:         string | null
  JobNumber:              string | null
  SourceFileName:         string | null
  ErectorExclusionText:   string | null
  MfcExclusionText:       string | null
  MfcItemType:            string | null
}

export interface HighRiskResponse {
  matches: HighRiskMatchRaw[]
  count:   number
}
