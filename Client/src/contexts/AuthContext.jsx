import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setToken(null)
      api.clearToken()
    }
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
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
      setToken(jwt)
      api.setToken(jwt)
      setUser({ userId, firstName, lastName, email })
      return { success: true }
    }
    setError('Login failed')
    return { success: false }
  }, [])

  const register = useCallback(async (data) => {
    setError(null)
    const result = await api.register(data)
    if (result.status === 400 || result.status === 409) {
      setError(result.error?.message || 'Registration failed')
      return { success: false, errors: result.error?.errors || {} }
    }
    if (result.status === 201 && result.data) {
      const { token: jwt, userId, firstName, lastName, email } = result.data
      setToken(jwt)
      api.setToken(jwt)
      setUser({ userId, firstName, lastName, email })
      return { success: true }
    }
    setError('Registration failed')
    return { success: false }
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    api.clearToken()
    setUser(null)
    setToken(null)
    setError(null)
  }, [])

  const fetchProfile = useCallback(async () => {
    const result = await api.getProfile()
    if (result.status === 200 && result.data) {
      setUser(result.data)
    }
    return result
  }, [])

  const updateProfile = useCallback(async (data) => {
    const result = await api.updateProfile(data)
    if (result.status === 200 && result.data) {
      setUser(result.data)
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
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
