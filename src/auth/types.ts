export interface User {
  id:                  number
  email:               string
  display_name:        string
  role:                'pending' | 'viewer' | 'estimator' | 'admin'
  is_active:           boolean
  is_estimator:        boolean
  is_admin:            boolean
  highlight_intensity: 'dim' | 'standard' | 'bright'
}

export interface AuthContextType {
  user:                 User | null
  isLoading:            boolean
  error:                string | null
  isAuthenticated:      boolean
  isPendingActivation:  boolean
  login:                () => Promise<void>
  logout:               () => void
  refreshUser:          () => Promise<void>
}
