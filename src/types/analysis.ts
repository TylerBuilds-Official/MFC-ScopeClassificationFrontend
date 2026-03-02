export interface ExtractionSummary {
  total_sections:     number
  total_items:        number
  method:             string
  section_labels:     string[]
  processing_time_ms: number
}

export interface ClassificationResult {
  extraction_id: number
  category_id:   number
  confidence:    number
  reasoning:     string | null
}

export interface ClassificationSummary {
  session_id:       number
  total_extracted:  number
  total_classified: number
  total_failed:     number
  batches_sent:     number
  batches_failed:   number
  avg_confidence:   number
  low_confidence:   ClassificationResult[]
}

export interface MatchResult {
  erector_extraction_id: number
  category_id:           number
  mfc_ids:               number[]
  match_type:            string
  confidence:            number
  risk_level:            string | null
  risk_notes:            string | null
  reasoning:             string | null
}

export interface ComparisonSummary {
  session_id:          number
  total_erector:       number
  total_mfc:           number
  total_aligned:       number
  total_partial:       number
  total_erector_only:  number
  total_mfc_only:      number
  categories_compared: number
  avg_confidence:      number
  processing_time_ms:  number
  high_risk_items:     MatchResult[]
}

export interface AnalysisResult {
  session_id:         number
  source_file:        string
  status:             string
  erector_name:       string | null
  erector_id:         number | null
  job_number:         string | null
  job_name:           string | null
  error_message:      string | null
  extraction:         ExtractionSummary | null
  classification:     ClassificationSummary | null
  comparison:         ComparisonSummary | null
  high_risk_items:    MatchResult[]
  processing_time_ms: number
}
