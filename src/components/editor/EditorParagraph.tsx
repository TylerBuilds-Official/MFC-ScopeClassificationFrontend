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

  // Find full region data by mfc_id
  function findRegion(mfcId: number): EditorRegion | undefined {

    return paragraph.regions.find(r => r.mfc_id === mfcId)
  }

  // Empty paragraph = spacer
  if (!paragraph.text.trim() && paragraph.segments.length === 0) {

    return <div className="editor-para editor-para-empty" />
  }

  // Paragraph indent
  const paraStyle: React.CSSProperties = {}
  if (paragraph.indent) {
    paraStyle.paddingLeft = `${paragraph.indent * 72}px`
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

          // Build className for text formatting
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

          // Region segment — clickable with highlight
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
