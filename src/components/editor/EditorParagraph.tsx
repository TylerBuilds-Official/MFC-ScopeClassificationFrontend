import { useRef } from 'react'
import { X } from 'lucide-react'
import type {
  EditorParagraph as EditorParagraphType,
  EditorSegment,
  EditorRegion,
} from '../../types/editor'


interface Props {
  paragraph:      EditorParagraphType
  removed:        boolean
  removedRegions: Set<string>
  onTextChange:   (index: number, text: string) => void
  onRemovePara:   (index: number) => void
  onRestorePara:  (index: number) => void
  onRegionClick:  (region: EditorRegion) => void
  onRemoveRegion: (paraIndex: number, mfcId: number) => void
}


function matchColor(type: string | null): string {
  switch (type) {
    case 'Aligned': return 'aligned'
    case 'Partial': return 'partial'
    default:        return 'unmatched'
  }
}


function segmentStyle(seg: EditorSegment): React.CSSProperties {
  const style: React.CSSProperties = {}

  if (seg.size)  style.fontSize = `${seg.size}pt`
  if (seg.color) style.color    = seg.color

  return style
}


export default function EditorParagraph({
    paragraph, removed, removedRegions, onTextChange, onRemovePara,
    onRestorePara, onRegionClick, onRemoveRegion }: Props) {

  const ref = useRef<HTMLDivElement>(null)

  function handleBlur() {
    if (!ref.current) return

    onTextChange(paragraph.index, ref.current.innerText)
  }

  function findRegion(mfcId: number): EditorRegion | undefined {

    return paragraph.regions.find(r => r.mfc_id === mfcId)
  }

  // Empty paragraph = spacer (preserve docx spacing)
  if (!paragraph.text.trim() && paragraph.segments.length === 0) {
    const emptyStyle: React.CSSProperties = {}
    if (paragraph.space_before) emptyStyle.marginTop    = `${paragraph.space_before}pt`
    if (paragraph.space_after)  emptyStyle.marginBottom = `${paragraph.space_after}pt`

    return <div className="editor-para editor-para-empty" style={emptyStyle} />
  }

  // Paragraph-level styles from docx formatting
  const paraStyle: React.CSSProperties = {}

  if (paragraph.indent) {
    paraStyle.paddingLeft = `${paragraph.indent * 96}px`
  }
  if (paragraph.hanging) {
    // Hanging indent: first line is pulled back from the left indent
    paraStyle.textIndent = `-${paragraph.hanging * 96}px`
  }
  if (paragraph.first_line) {
    // First line indent: first line is pushed further in
    paraStyle.textIndent = `${paragraph.first_line * 96}px`
  }
  // Only apply justify — left is default, and right/center from docx are
  // usually tab-stop positioning rather than true paragraph alignment.
  if (paragraph.alignment === 'justify') {
    paraStyle.textAlign = 'justify'
  }
  if (paragraph.space_before) {
    paraStyle.marginTop = `${paragraph.space_before}pt`
  }
  if (paragraph.space_after) {
    paraStyle.marginBottom = `${paragraph.space_after}pt`
  }
  if (paragraph.line_spacing && paragraph.line_spacing > 0) {
    if (paragraph.line_spacing <= 3) {
      paraStyle.lineHeight = String(paragraph.line_spacing)
    } else {
      paraStyle.lineHeight = `${paragraph.line_spacing}pt`
    }
  }

  return (
    <div className={`editor-para-row ${removed ? 'removed' : ''}`}>
      <div className="editor-gutter">
        {removed ? (
          <button
            className="editor-gutter-btn restore"
            onClick={() => onRestorePara(paragraph.index)}
            title="Restore paragraph"
          >
            +
          </button>
        ) : paragraph.text.trim() ? (
          <button
            className="editor-gutter-btn"
            onClick={() => onRemovePara(paragraph.index)}
            title="Remove paragraph"
          >
            &times;
          </button>
        ) : null}
      </div>

      <div
        ref={ref}
        className="editor-para"
        style={paraStyle}
        contentEditable={!removed}
        suppressContentEditableWarning
        onBlur={handleBlur}
        spellCheck={false}
      >
        {paragraph.segments.map((seg, i) => {
          const isRegion   = !!seg.region
          const regionKey  = isRegion ? `${paragraph.index}:${seg.region!.mfc_id}` : null
          const isRemoved  = regionKey ? removedRegions.has(regionKey) : false

          if (isRemoved) return null

          const classes: string[] = []
          if (seg.bold)      classes.push('seg-bold')
          if (seg.italic)    classes.push('seg-italic')
          if (seg.underline) classes.push('seg-underline')

          if (!isRegion) {

            return (
              <span key={i} className={classes.join(' ')} style={segmentStyle(seg)}>
                {seg.text}
              </span>
            )
          }

          const fullRegion = findRegion(seg.region!.mfc_id)
          classes.push('editor-region')
          classes.push(matchColor(seg.region!.match_type))

          return (
            <span
              key={`r-${seg.region!.mfc_id}-${i}`}
              className={classes.join(' ')}
              style={segmentStyle(seg)}
              onClick={(e) => {
                e.stopPropagation()
                if (fullRegion) onRegionClick(fullRegion)
              }}
            >
              {seg.text}
              <button
                className="editor-region-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveRegion(paragraph.index, seg.region!.mfc_id)
                }}
                title="Remove this exclusion"
              >
                <X size={10} />
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}
