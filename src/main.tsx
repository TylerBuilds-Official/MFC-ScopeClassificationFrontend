import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './auth/msalInstance'
import { AuthProvider } from './auth'
import { RunningSessionsProvider } from './hooks/useRunningSessions'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'

import './styles/global.css'
import './styles/layout.css'
import './styles/sessions.css'
import './styles/matches.css'
import './styles/analyze.css'
import './styles/heatmap.css'
import './styles/exclusions.css'
import './styles/toast.css'
import './styles/progress.css'
import './styles/auth.css'

msalInstance.initialize().then(async () => {
  // Process auth code from redirect before rendering
  await msalInstance.handleRedirectPromise().catch(console.error)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <BrowserRouter>
            <RunningSessionsProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </RunningSessionsProvider>
          </BrowserRouter>
        </AuthProvider>
      </MsalProvider>
    </StrictMode>,
  )
})
