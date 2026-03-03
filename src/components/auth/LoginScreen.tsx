import { Search, LogIn } from 'lucide-react'
import { useAuth } from '../../auth'


export default function LoginScreen() {
  const { login, error } = useAuth()

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Search size={24} />
          </div>
          <h1>Scope Analysis</h1>
          <p>Erector scope letter classification and risk assessment</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-sign-in" onClick={login}>
          <LogIn size={16} />
          Sign in with Microsoft
        </button>

        <span className="auth-footer">
          Metals Fabrication Company — Internal Tool
        </span>
      </div>
    </div>
  )
}
