import { get, downloadBlob } from './client'
import type { ScopeLetterData } from '../types/editor'


export async function downloadScopeLetter(sessionId: number): Promise<void> {

  const { blob, filename } = await downloadBlob(`/export/session/${sessionId}/scope-letter`)

  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href     = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


export async function downloadEditorExport(sessionId: number, viewMode: string): Promise<void> {

  const { blob, filename } = await downloadBlob(
    `/export/session/${sessionId}/editor-export?view_mode=${encodeURIComponent(viewMode)}`
  )

  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href     = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


export async function getScopeLetterData(sessionId: number): Promise<ScopeLetterData> {

  return get<ScopeLetterData>(`/export/session/${sessionId}/scope-letter-data`)
}
