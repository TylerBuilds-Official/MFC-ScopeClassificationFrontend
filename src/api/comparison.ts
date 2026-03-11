import { get, post, del_ } from './client'
import type {
  ComparisonListResponse,
  ComparisonResult,
  ComparisonProgress,
} from '../types/comparison'


export async function getComparisons(
  limit  = 50,
  offset = 0,
): Promise<ComparisonListResponse> {

  return get<ComparisonListResponse>('/comparison', { limit, offset })
}


export async function getComparison(id: number): Promise<ComparisonResult> {

  return get<ComparisonResult>(`/comparison/${id}`)
}


export async function getComparisonProgress(id: number): Promise<ComparisonProgress> {

  return get<ComparisonProgress>(`/comparison/${id}/progress`)
}


export async function createComparison(body: {
  session_ids:   number[]
  job_number?:   string
  job_name?:     string
  initiated_by?: string
}): Promise<{ comparison_id: number; status: string }> {

  return post('/comparison', body)
}


export async function createComparisonFromUploads(
  files:        File[],
  erectorNames: string[],
  jobNumber?:   string,
  jobName?:     string,
): Promise<{ comparison_id: number; status: string }> {

  const form = new FormData()

  files.forEach(f => form.append('files', f))
  form.append('erector_names', erectorNames.join(','))

  if (jobNumber) form.append('job_number', jobNumber)
  if (jobName)   form.append('job_name', jobName)

  return post('/comparison/upload', form)
}


export async function addErectorToComparison(
  comparisonId:     number,
  analysisSessionId: number,
): Promise<{ comparison_id: number; status: string; message: string }> {

  return post(`/comparison/${comparisonId}/add`, { analysis_session_id: analysisSessionId })
}


export async function addErectorUpload(
  comparisonId: number,
  file:         File,
  erectorName:  string,
  jobNumber?:   string,
): Promise<{ comparison_id: number; status: string; message: string }> {

  const form = new FormData()
  form.append('file', file)
  form.append('erector_name', erectorName)
  if (jobNumber) form.append('job_number', jobNumber)

  return post(`/comparison/${comparisonId}/add-upload`, form)
}


export async function rerunComparison(
  id: number,
): Promise<{ comparison_id: number; status: string; message: string }> {

  return post(`/comparison/${id}/rerun`, {})
}


export async function deleteComparison(id: number): Promise<{ deleted: number }> {

  return del_<{ deleted: number }>(`/comparison/${id}`)
}
