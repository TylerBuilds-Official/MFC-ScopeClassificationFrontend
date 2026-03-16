/**
 * Arrow key navigation across contentEditable paragraph divs.
 *
 * Handles Up/Down (line boundary) and Left/Right (character boundary)
 * to move focus between sibling .editor-para elements inside .editor-doc.
 */


/** Get all editable paragraph elements in document order. */
function getAllParas(el: HTMLElement): HTMLElement[] {
  const doc = el.closest('.editor-doc')
  if (!doc) return []

  return Array.from(doc.querySelectorAll<HTMLElement>('.editor-para[contenteditable="true"]'))
}


/** Get the index of an element within the ordered paragraph list. */
function getParaIndex(el: HTMLElement, paras: HTMLElement[]): number {
  return paras.indexOf(el)
}


/** Check if the cursor is at the very start of the element (offset 0). */
function isCursorAtStart(): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false

  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false

  // Create a range from the start of the container to the cursor
  const pre = document.createRange()
  pre.setStart(range.startContainer.parentElement?.closest('.editor-para') ?? range.startContainer, 0)
  pre.setEnd(range.startContainer, range.startOffset)

  return pre.toString().length === 0
}


/** Check if the cursor is at the very end of the element. */
function isCursorAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false

  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false

  // Create a range from the cursor to the end of the element
  const post = document.createRange()
  post.setStart(range.endContainer, range.endOffset)
  post.setEnd(el, el.childNodes.length)

  return post.toString().length === 0
}


/** Check if the cursor is on the first visual line of the element. */
function isCursorOnFirstLine(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false

  const range     = sel.getRangeAt(0)
  const cursorRect = range.getBoundingClientRect()
  const elRect     = el.getBoundingClientRect()

  // If cursor Y is within ~4px of the element top, it's on the first line
  return cursorRect.top - elRect.top < 4
}


/** Check if the cursor is on the last visual line of the element. */
function isCursorOnLastLine(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false

  const range     = sel.getRangeAt(0)
  const cursorRect = range.getBoundingClientRect()
  const elRect     = el.getBoundingClientRect()

  // If cursor bottom is within ~4px of the element bottom, it's on the last line
  return elRect.bottom - cursorRect.bottom < 4
}


/** Place the cursor at the start of an element and focus it. */
function focusAtStart(el: HTMLElement): void {
  el.focus()

  const sel   = window.getSelection()
  const range = document.createRange()

  if (el.childNodes.length > 0) {
    range.setStart(el, 0)
  } else {
    range.setStart(el, 0)
  }

  range.collapse(true)
  sel?.removeAllRanges()
  sel?.addRange(range)
}


/** Place the cursor at the end of an element and focus it. */
function focusAtEnd(el: HTMLElement): void {
  el.focus()

  const sel   = window.getSelection()
  const range = document.createRange()

  if (el.childNodes.length > 0) {
    range.selectNodeContents(el)
    range.collapse(false)
  } else {
    range.setStart(el, 0)
    range.collapse(true)
  }

  sel?.removeAllRanges()
  sel?.addRange(range)
}


/**
 * Handle arrow key events on a contentEditable .editor-para.
 * Call this from onKeyDown. Returns true if the event was handled
 * (caller should preventDefault).
 */
export function handleEditorKeyDown(e: React.KeyboardEvent<HTMLDivElement>): boolean {
  const el    = e.currentTarget
  const paras = getAllParas(el)
  const idx   = getParaIndex(el, paras)

  if (idx === -1) return false

  const prev = idx > 0 ? paras[idx - 1] : null
  const next = idx < paras.length - 1 ? paras[idx + 1] : null

  switch (e.key) {
    case 'ArrowUp':
      if (isCursorOnFirstLine(el) && prev) {
        e.preventDefault()
        focusAtEnd(prev)

        return true
      }
      break

    case 'ArrowDown':
      if (isCursorOnLastLine(el) && next) {
        e.preventDefault()
        focusAtStart(next)

        return true
      }
      break

    case 'ArrowLeft':
      if (isCursorAtStart() && prev) {
        e.preventDefault()
        focusAtEnd(prev)

        return true
      }
      break

    case 'ArrowRight':
      if (isCursorAtEnd(el) && next) {
        e.preventDefault()
        focusAtStart(next)

        return true
      }
      break
  }

  return false
}
