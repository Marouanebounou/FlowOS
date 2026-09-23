import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const OrganisationContext = createContext(null)

const ACTIVE_KEY = 'flowos_active_org'

function readActiveId() {
  try {
    const v = localStorage.getItem(ACTIVE_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

export function OrganisationProvider({ children }) {
  const { isAuthenticated, loading: authLoading, token } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [activeId, setActiveId] = useState(() => readActiveId())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganizations([])
      setLoading(false)
      return []
    }
    setLoading(true)
    setError(null)
    const result = await api.listOrganizations()
    if (result.status === 200 && Array.isArray(result.data)) {
      setOrganizations(result.data)
      // auto-select first if none selected or selected not in list
      const ids = result.data.map((o) => o.id)
      const current = readActiveId()
      if (result.data.length > 0 && (current == null || !ids.includes(current))) {
        const first = result.data[0].id
        setActiveId(first)
        try { localStorage.setItem(ACTIVE_KEY, String(first)) } catch {}
      } else if (result.data.length === 0) {
        setActiveId(null)
        try { localStorage.removeItem(ACTIVE_KEY) } catch {}
      }
      setLoading(false)
      return result.data
    }
    setError(result.error?.message || 'Failed to load organizations')
    setLoading(false)
    return []
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setOrganizations([])
      setActiveId(null)
      try { localStorage.removeItem(ACTIVE_KEY) } catch {}
      return
    }
    refresh()
  }, [authLoading, isAuthenticated, token, refresh])

  // also refetch when window regains focus or auth changes? keep simple

  const select = useCallback((id) => {
    const num = id != null ? Number(id) : null
    setActiveId(num)
    try {
      if (num == null) localStorage.removeItem(ACTIVE_KEY)
      else localStorage.setItem(ACTIVE_KEY, String(num))
    } catch {}
  }, [])

  const clear = useCallback(() => {
    setActiveId(null)
    try { localStorage.removeItem(ACTIVE_KEY) } catch {}
  }, [])

  const activeOrganization = organizations.find((o) => o.id === activeId) || null

  return (
    <OrganisationContext.Provider
      value={{
        organizations,
        activeId,
        activeOrganization,
        loading,
        error,
        refresh,
        select,
        clear,
        setOrganizations,
      }}
    >
      {children}
    </OrganisationContext.Provider>
  )
}

export function useOrganisation() {
  const ctx = useContext(OrganisationContext)
  if (!ctx) throw new Error('useOrganisation must be used within OrganisationProvider')
  return ctx
}

// alias British spelling for convenience
export const useOrganization = useOrganisation
