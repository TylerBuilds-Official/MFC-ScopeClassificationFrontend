import { useNavigate } from 'react-router-dom'


interface MfcIdLinkProps {
  id:     number | null
  label?: string
}


export default function MfcIdLink({ id, label }: MfcIdLinkProps) {
  const navigate = useNavigate()

  if (id == null) return null

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    navigate(`/exclusions?highlight=${id}`)
  }

  return (
    <button
      className="mfc-id-link"
      onClick={handleClick}
      title={`View MFC Exclusion #${id}`}
    >
      {label ?? `#${id}`}
    </button>
  )
}
