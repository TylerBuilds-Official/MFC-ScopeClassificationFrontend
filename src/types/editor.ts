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

export interface TabStop {
  position_in: number
  alignment:   string
}

export interface EditorParagraph {
  index:        number
  text:         string
  indent:       number | null
  hanging:      number | null
  first_line:   number | null
  alignment:    'left' | 'center' | 'right' | 'justify' | null
  space_before: number | null
  space_after:  number | null
  line_spacing: number | null
  tab_stops:    TabStop[] | null
  segments:     EditorSegment[]
  regions:      EditorRegion[]
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
