export interface MfcExclusion {
  Id:         number
  CategoryId: number
  Exclusion:  string
  ItemType:   string
  SortOrder:  number
}

export interface MfcExclusionListResponse {
  exclusions: MfcExclusion[]
  count:      number
}
