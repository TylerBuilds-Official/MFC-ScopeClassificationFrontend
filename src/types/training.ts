export interface TrainingQueueItem {
  extraction_id:             number
  raw_text:                  string
  normalized_text:           string | null
  category_id:               number
  category_name:             string
  classification_confidence: number
  session_id:                number
  erector_name:              string | null
  job_number:                string | null
  job_name:                  string | null
}

export interface TrainingQueueResponse {
  items:            TrainingQueueItem[]
  total_pending:    number
  total_verified:   number
  total_overridden: number
  max_confidence:   number
}

export interface TrainingStatsResponse {
  total_verified:   number
  total_overridden: number
  total_pending:    number
  accuracy_rate:    number | null
}

export interface TrainingVerifyResult {
  id:              number
  was_overridden:  boolean
  action:          string
}
