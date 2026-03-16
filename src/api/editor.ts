import { post, put, patch } from './client'


const BASE = '/editor'


export async function removeRegion(sessionId: number, mfcExclusionId: number, paraIndex: number): Promise<void> {

  await post(`${BASE}/session/${sessionId}/remove-region`, {
    mfc_exclusion_id: mfcExclusionId,
    para_index:       paraIndex,
  })
}


export async function restoreRegion(sessionId: number, mfcExclusionId: number): Promise<void> {

  await post(`${BASE}/session/${sessionId}/restore-region`, {
    mfc_exclusion_id: mfcExclusionId,
  })
}


export async function removeParagraph(sessionId: number, paraIndex: number): Promise<void> {

  await post(`${BASE}/session/${sessionId}/remove-paragraph`, {
    para_index: paraIndex,
  })
}


export async function restoreParagraph(sessionId: number, paraIndex: number): Promise<void> {

  await post(`${BASE}/session/${sessionId}/restore-paragraph`, {
    para_index: paraIndex,
  })
}


export async function saveTextEdit(sessionId: number, paraIndex: number, editedText: string): Promise<void> {

  await put(`${BASE}/session/${sessionId}/text-edit`, {
    para_index:  paraIndex,
    edited_text: editedText,
  })
}


export async function resetEditorState(sessionId: number): Promise<void> {

  await post(`${BASE}/session/${sessionId}/reset`, {})
}


export async function updateHighlightIntensity(intensity: string): Promise<void> {

  await patch('/me/preferences', { highlight_intensity: intensity })
}
