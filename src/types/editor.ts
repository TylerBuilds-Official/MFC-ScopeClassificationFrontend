export interface SegmentRegion {
  mfc_id:     number
  match_type: string | null
  risk_level: string | null
}

export interface EditorSegment {
  text:       string
  bold?:      boolean
  italic?:    boolean
  underline?: boolean
  size?:      number
  color?:     string
  region?:    SegmentRegion
}

export interface EditorRegion {
  mfc_id:       number
  start:        number
  end:          number
  snippet:      string
  match_type:   string | null
  confidence:   number | null
  risk_level:   string | null
  risk_notes:   string | null
  ai_reasoning: string | null
  erector_text: string | null
}

export interface EditorParagraph {
  index:    number
  text:     string
  indent:   number | null
  segments: EditorSegment[]
  regions:  EditorRegion[]
}

export interface ScopeLetterData {
  session: {
    id:       number
    erector:  string
    job:      string
    job_name: string
  }
  paragraphs: EditorParagraph[]
}
