/**
 * Tab Resolver — computes exact pixel-width spacers for Word tab stops.
 *
 * Uses an off-screen Canvas measureText() to get the browser's actual font
 * metrics, then calculates the precise gap needed to reach each tab stop.
 *
 * This replaces CSS tab-size (which is uniform width) with positional
 * tab rendering that matches Word's "jump TO position" behavior.
 */

import type { EditorSegment, EditorParagraph } from '../types/editor'


/** Resolved segment — either original text/region or a computed spacer. */
export interface ResolvedSegment {
  type:       'text' | 'spacer'
  seg?:       EditorSegment       // original segment (for text type)
  spacer_px?: number              // computed width (for spacer type)
}


// Default tab interval: 0.5" at 96dpi
const DEFAULT_TAB_PX = 48
const DPI            = 96

// Shared canvas context (lazily initialized)
let _ctx: CanvasRenderingContext2D | null = null


function getContext(): CanvasRenderingContext2D {
  if (!_ctx) {
    const canvas = document.createElement('canvas')
    _ctx = canvas.getContext('2d')!
  }

  return _ctx
}


/** Build a CSS font string matching the editor paragraph style. */
function buildFontString(bold?: boolean, italic?: boolean, sizePt?: number): string {
  const style  = italic ? 'italic' : 'normal'
  const weight = bold ? '700' : '400'
  const size   = sizePt ? `${sizePt}pt` : '12pt'

  return `${style} ${weight} ${size} Shruti, 'Nirmala UI', sans-serif`
}


/** Measure exact pixel width of text using Canvas. */
function measureText(text: string, bold?: boolean, italic?: boolean, sizePt?: number): number {
  const ctx  = getContext()
  ctx.font   = buildFontString(bold, italic, sizePt)

  return ctx.measureText(text).width
}


/** Find the next tab stop position (in px) from the current cursor position.
 *  gridOrigin is the paragraph's left indent — Word anchors default tab stops
 *  at the indent, not at the page margin. */
function nextTabStop(cursor: number, tabStops: number[], gridOrigin: number): number {
  // Check explicit tab stops first (positive ones only)
  for (const stop of tabStops) {
    if (stop > 0 && stop > cursor + 1) {

      return stop
    }
  }

  // Default grid anchored at the paragraph indent
  // Stops at: origin, origin+48, origin+96, ...
  let stop = gridOrigin
  while (stop <= cursor) {
    stop += DEFAULT_TAB_PX
  }

  return stop
}


/**
 * Resolve tab characters in paragraph segments into precise pixel spacers.
 *
 * Walks each segment measuring text width with Canvas measureText(),
 * then replaces \t characters with spacer entries that have exact widths
 * computed to reach the next tab stop position.
 */
export function resolveTabSpacers(paragraph: EditorParagraph): ResolvedSegment[] {
  // Parse explicit tab stop positions to pixels
  const tabStops = (paragraph.tab_stops ?? [])
    .map(ts => ts.position_in * DPI)
    .sort((a, b) => a - b)

  // Grid origin = paragraph indent position (where default tab stops anchor)
  const indentPx  = (paragraph.indent ?? 0) * DPI
  const hangingPx = (paragraph.hanging ?? 0) * DPI
  const gridOrigin = indentPx

  // Cursor start: first line starts at indent minus hanging
  let cursor = Math.max(indentPx - hangingPx, 0)

  const resolved: ResolvedSegment[] = []

  for (const seg of paragraph.segments) {
    const text = seg.text ?? ''

    // No tabs — measure and pass through
    if (!text.includes('\t')) {
      const w = measureText(text, seg.bold, seg.italic, seg.size)
      cursor += w
      resolved.push({ type: 'text', seg })

      continue
    }

    // Split at tab characters
    const parts = text.split('\t')

    for (let pi = 0; pi < parts.length; pi++) {
      // Emit text part (if non-empty)
      if (parts[pi]) {
        const partSeg: EditorSegment = { ...seg, text: parts[pi] }
        const w = measureText(parts[pi], seg.bold, seg.italic, seg.size)
        cursor += w
        resolved.push({ type: 'text', seg: partSeg })
      }

      // Emit spacer for each tab (except after the last part)
      if (pi < parts.length - 1) {
        const target   = nextTabStop(cursor, tabStops, gridOrigin)
        const spacerW  = Math.max(target - cursor, 4)  // minimum 4px gap
        cursor         = target
        resolved.push({ type: 'spacer', spacer_px: Math.round(spacerW) })
      }
    }
  }

  return resolved
}
