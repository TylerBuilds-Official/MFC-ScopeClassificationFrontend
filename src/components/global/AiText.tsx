import { Fragment } from 'react'
import MfcIdLink from './MfcIdLink'


interface AiTextProps {
  text:       string
  className?: string
}

const ID_PATTERN = /\bid\s*#?(\d+)/gi


export default function AiText({ text, className }: AiTextProps) {
  const parts:  React.ReactNode[] = []
  let   lastIdx = 0
  let   match:  RegExpExecArray | null

  while ((match = ID_PATTERN.exec(text)) !== null) {
    const before = text.slice(lastIdx, match.index)
    const id     = parseInt(match[1], 10)

    if (before) parts.push(before)

    parts.push(
      <MfcIdLink
        key={`${match.index}-${id}`}
        id={id}
        label={`ID ${id}`}
      />,
    )

    lastIdx = match.index + match[0].length
  }

  const tail = text.slice(lastIdx)
  if (tail) parts.push(tail)

  return (
    <span className={className}>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </span>
  )
}
