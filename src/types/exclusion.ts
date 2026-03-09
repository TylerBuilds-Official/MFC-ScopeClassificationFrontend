export interface MfcExclusion {
  Id:         number
  CategoryId: number
  Exclusion:  string
  Section:    string | null
  ItemType:   string
  ScopeType:  string
  IsStandard: boolean
  Notes:      string | null
  SortOrder:  number
}

export interface MfcExclusionListResponse {
  exclusions: MfcExclusion[]
  count:      number
}
