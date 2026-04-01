import { get, downloadBlob } from './client'
import type { ScopeLetterData } from '../types/editor'


function triggerDownload(blob: Blob, filename: string): void {

  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href     = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


export async function downloadScopeLetter(
    sessionId: number,
    viewMode:  string = 'full' ): Promise<void> {

  const { blob, filename } = await downloadBlob(
    `/export/session/${sessionId}/scope-letter?view_mode=${encodeURIComponent(viewMode)}`
  )

  triggerDownload(blob, filename)
}


export async function downloadEditorExport(
    sessionId: number,
    viewMode:  string = 'erector_exclusions' ): Promise<void> {

  const { blob, filename } = await downloadBlob(
    `/export/session/${sessionId}/editor-export?view_mode=${encodeURIComponent(viewMode)}`
  )

  triggerDownload(blob, filename)
}


export async function downloadHighlightedEditorExport(
    sessionId: number,
    viewMode:  string = 'erector_exclusions' ): Promise<void> {

  const { blob, filename } = await downloadBlob(
    `/export/session/${sessionId}/highlighted-editor-export?view_mode=${encodeURIComponent(viewMode)}`
  )

  triggerDownload(blob, filename)
}


export async function getScopeLetterData(sessionId: number): Promise<ScopeLetterData> {

  return get<ScopeLetterData>(`/export/session/${sessionId}/scope-letter-data`)
}
