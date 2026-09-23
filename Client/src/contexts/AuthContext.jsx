import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

const USER_KEY = 'flowos_user'

function readStoredToken() {
  try {
    return localStorage.getItem('flowos_token')
  } catch {
    return null
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [token, setToken] = useState(() => readStoredToken())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Hydrate api client + validate session on mount
  useEffect(() => {
    const storedToken = readStoredToken()
    const storedUser = readStoredUser()

    if (storedToken) {
      api.setToken(storedToken)
      setToken(storedToken)
      if (storedUser) setUser(storedUser)

      // verify token is still valid by fetching profile
      let cancelled = false
      api.getProfile().then((result) => {
        if (cancelled) return
        if (result.status === 200 && result.data) {
          setUser(result.data)
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(result.data))
          } catch {
            // ignore
          }
        } else if (result.status === 401 || result.status === 403) {
          // token invalid/expired -> clear session, will redirect via ProtectedRoute
          setUser(null)
          setToken(null)
          api.clearToken()
          try {
            localStorage.removeItem(USER_KEY)
          } catch {
            // ignore
          }
        }
        // for 403 above, api already dispatched auth:logout - handled below
        setLoading(false)
      })

      return () => {
        cancelled = true
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setToken(null)
      api.clearToken()
      try {
        localStorage.removeItem(USER_KEY)
      } catch {
        // ignore
      }
      setLoading(false)
    }
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const persistSession = useCallback((jwt, userData) => {
    setToken(jwt)
    api.setToken(jwt)
    setUser(userData)
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
    } catch {
      // ignore
    }
  }, [])

  const login = useCallback(async (credentials) => {
    setError(null)
    const result = await api.login(credentials)
    if (result.status === 401 || result.status === 400) {
      setError(result.error?.message || 'Invalid credentials')
      return { success: false }
    }
    if (result.status === 200 && result.data) {
      const { token: jwt, userId, firstName, lastName, email } = result.data
      persistSession(jwt, { userId, firstName, lastName, email })
      // optionally fetch full profile
      api.getProfile().then((r) => {
        if (r.status === 200 && r.data) {
          setUser(r.data)
          try { localStorage.setItem(USER_KEY, JSON.stringify(r.data)) } catch {}
        }
      })
      return { success: true }
    }
    setError('Login failed')
    return { success: false }
  }, [persistSession])

  const register = useCallback(async (data) => {
    setError(null)
    const result = await api.register(data)
    if (result.status === 400 || result.status === 409) {
      setError(result.error?.message || 'Registration failed')
      return { success: false, errors: result.error?.errors || {} }
    }
    if (result.status === 201 && result.data) {
      const { token: jwt, userId, firstName, lastName, email } = result.data
      persistSession(jwt, { userId, firstName, lastName, email })
      api.getProfile().then((r) => {
        if (r.status === 200 && r.data) {
          setUser(r.data)
          try { localStorage.setItem(USER_KEY, JSON.stringify(r.data)) } catch {}
        }
      })
      return { success: true }
    }
    setError('Registration failed')
    return { success: false }
  }, [persistSession])

  const logout = useCallback(async () => {
    await api.logout()
    api.clearToken()
    setUser(null)
    setToken(null)
    setError(null)
    try { localStorage.removeItem(USER_KEY) } catch {}
  }, [])

  const fetchProfile = useCallback(async () => {
    const result = await api.getProfile()
    if (result.status === 200 && result.data) {
      setUser(result.data)
      try { localStorage.setItem(USER_KEY, JSON.stringify(result.data)) } catch {}
    }
    return result
  }, [])

  const updateProfile = useCallback(async (data) => {
    const result = await api.updateProfile(data)
    if (result.status === 200 && result.data) {
      setUser(result.data)
      try { localStorage.setItem(USER_KEY, JSON.stringify(result.data)) } catch {}
    }
    return result
  }, [])

  const changePassword = useCallback(async (data) => {
    const result = await api.changePassword(data)
    return result
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    changePassword,
    setError,
    clearError,
    setSession: persistSession,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
