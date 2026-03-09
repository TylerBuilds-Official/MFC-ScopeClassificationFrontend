import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { loginRequest, apiTokenRequest } from './authConfig'
import type { User, AuthContextType } from './types'


const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, inProgress, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  const [user, setUser]         = useState<User | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)


  const fetchUserInfo = useCallback(async () => {
    if (!isAuthenticated || accounts.length === 0) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const tokenResponse = await instance.acquireTokenSilent({
        ...apiTokenRequest,
        account: accounts[0],
      })

      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      })

      if (res.status === 401) {
        setError('Session expired. Please sign in again.')
        setUser(null)
        return
      }

      if (res.status === 403) {
        const body = await res.json().catch(() => ({}))
        setError(body.detail || 'Access denied. Your account may not be activated.')
        setUser(null)
        return
      }

      if (!res.ok) throw new Error(`Failed to fetch user info: ${res.status}`)

      const userData: User = await res.json()
      setUser(userData)
    } catch (err) {
      console.error('[Auth] Error fetching user info:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, accounts, instance])


  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      fetchUserInfo()
    }
  }, [inProgress, fetchUserInfo])


  const login = useCallback(async () => {
    try {
      setError(null)
      await instance.loginRedirect({
        ...loginRequest,
        prompt: 'select_account',
      })
    } catch (err) {
      console.error('[Auth] Login redirect failed:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login failed. Please try again.')
      }
    }
  }, [instance])


  const logout = useCallback(async () => {
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: '/',
      })
      setUser(null)
    } catch (err) {
      console.error('[Auth] Logout failed:', err)
      setUser(null)
    }
  }, [instance])


  const refreshUser = useCallback(async () => {
    await fetchUserInfo()
  }, [fetchUserInfo])


  const isPendingActivation = user !== null && !user.is_active

  const value: AuthContextType = {
    user,
    isLoading:            isLoading || inProgress !== InteractionStatus.None,
    error,
    isAuthenticated:      isAuthenticated && user !== null,
    isPendingActivation,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
