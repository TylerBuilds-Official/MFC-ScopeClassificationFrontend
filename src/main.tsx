import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RunningSessionsProvider } from './hooks/useRunningSessions'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RunningSessionsProvider>
        <App />
      </RunningSessionsProvider>
    </BrowserRouter>
  </StrictMode>,
)
