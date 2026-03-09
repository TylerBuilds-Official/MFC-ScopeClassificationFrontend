import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface HeaderProps {
  title: string
  breadcrumb?: string[]
  children?: React.ReactNode
}

export default function Header({ title, breadcrumb, children }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

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

      <div className="header-actions">
        {children}

        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

    </header>
  )
}
