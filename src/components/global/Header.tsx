interface HeaderProps {
  title: string
  breadcrumb?: string[]
  children?: React.ReactNode
}

export default function Header({ title, breadcrumb, children }: HeaderProps) {
  return (
    <header className="header">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="header-breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                {crumb}
              </span>
            ))}
          </div>
        )}
        <div className="header-title">{title}</div>
      </div>
      {children && <div className="header-actions">{children}</div>}
    </header>
  )
}
