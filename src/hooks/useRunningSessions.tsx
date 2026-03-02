import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { getSessionProgress } from '../api/sessions'
import type { SessionProgress } from '../types/session'


interface RunningSession {
  sessionId: number
  progress:  SessionProgress | null
  dismissed: boolean
}

interface RunningSessionsContextType {
  sessions:  RunningSession[]
  track:     (sessionId: number) => void
  dismiss:   (sessionId: number) => void
}

const RunningSessionsContext = createContext<RunningSessionsContextType>({
  sessions: [],
  track:    () => {},
  dismiss:  () => {},
})


export function useRunningSessions() {
  return useContext(RunningSessionsContext)
}


const POLL_INTERVAL = 3000


export function RunningSessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<RunningSession[]>([])
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)

  const track = useCallback((sessionId: number) => {
    setSessions(prev => {
      if (prev.some(s => s.sessionId === sessionId)) return prev

      return [...prev, { sessionId, progress: null, dismissed: false }]
    })
  }, [])

  const dismiss = useCallback((sessionId: number) => {
    setSessions(prev =>
      prev.map(s =>
        s.sessionId === sessionId ? { ...s, dismissed: true } : s
      )
    )
  }, [])

  useEffect(() => {
    const activeSessions = sessions.filter(
      s => !s.progress || s.progress.is_active || !['Complete', 'Error'].includes(s.progress.status)
    )

    if (activeSessions.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      return
    }

    async function pollAll() {
      const updates = await Promise.all(
        activeSessions.map(async s => {
          try {
            const progress = await getSessionProgress(s.sessionId)

            return { sessionId: s.sessionId, progress }
          } catch {
            return null
          }
        })
      )

      setSessions(prev =>
        prev.map(s => {
          const update = updates.find(u => u?.sessionId === s.sessionId)
          if (!update) return s

          return { ...s, progress: update.progress }
        })
      )
    }

    // Poll immediately, then on interval
    pollAll()

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(pollAll, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [sessions.map(s => s.sessionId).join(','), sessions.map(s => s.progress?.status).join(',')])

  return (
    <RunningSessionsContext.Provider value={{ sessions, track, dismiss }}>
      {children}
    </RunningSessionsContext.Provider>
  )
}
