import { post } from './client'


interface AnalyzeParams {
  networkPath?:  string
  erectorName?:  string
  jobNumber?:    string
  jobName?:      string
  initiatedBy?:  string
  archive?:      boolean
  file?:         File
}

interface AnalyzeResponse {
  session_id: number
  status:     string
}


export async function analyzeScope(params: AnalyzeParams): Promise<AnalyzeResponse> {

  const form = new FormData()

  if (params.networkPath)  form.append('network_path',  params.networkPath)
  if (params.erectorName)  form.append('erector_name',  params.erectorName)
  if (params.jobNumber)    form.append('job_number',    params.jobNumber)
  if (params.jobName)      form.append('job_name',      params.jobName)
  if (params.initiatedBy)  form.append('initiated_by',  params.initiatedBy)
  if (params.file)         form.append('file',          params.file)

  form.append('archive', String(params.archive ?? true))

  return post<AnalyzeResponse>('/analyze', form)
}
