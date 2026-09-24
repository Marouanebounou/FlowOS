import { useEffect, useState, useCallback } from 'react'
import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress, Chip, Switch, Grid, Divider } from '@mui/material'
import { Extension, Add, Delete, PowerSettingsNew } from '@mui/icons-material'
import { api } from '../api/client'

const ICONS = {
  tasks: '✓',
  projects: '📁',
  calendar: '📅',
  crm: '👥',
  documents: '📄',
}

export default function ModulesTab({ organisationId, isAdmin }) {
  const [catalog, setCatalog] = useState([])
  const [installed, setInstalled] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [snack, setSnack] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    const [catRes, instRes] = await Promise.all([api.listModules(), api.listInstalledModules(organisationId)])
    if (catRes.status === 200) setCatalog(catRes.data)
    else setError(catRes.error?.message || 'Failed to load catalog')
    if (instRes.status === 200) setInstalled(instRes.data)
    else if (instRes.status !== 200) setInstalled([])
    setLoading(false)
  }, [organisationId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const installedKeys = new Set(installed.map((m) => m.moduleKey))

  async function handleInstall(key) {
    setActionId(key); setSnack(null)
    const res = await api.installModule(organisationId, key)
    setActionId(null)
    if (res.status === 200 && res.data) {
      setSnack({ severity: 'success', message: `${key} installed` })
      fetchAll()
    } else setSnack({ severity: 'error', message: res.error?.message || `Install failed (${res.status})` })
  }

  async function handleUninstall(key) {
    if (!confirm(`Uninstall ${key}?`)) return
    setActionId(key)
    const res = await api.uninstallModule(organisationId, key)
    setActionId(null)
    if (res.status === 204) {
      setSnack({ severity: 'success', message: `${key} uninstalled` })
      fetchAll()
    } else setSnack({ severity: 'error', message: res.error?.message || 'Uninstall failed' })
  }

  async function handleToggle(key, enabled) {
    setActionId(key)
    const res = await api.setModuleEnabled(organisationId, key, enabled)
    setActionId(null)
    if (res.status === 200) {
      setInstalled((prev) => prev.map((m) => m.moduleKey === key ? { ...m, enabled } : m))
      setSnack({ severity: 'success', message: `${key} ${enabled ? 'enabled' : 'disabled'}` })
    } else setSnack({ severity: 'error', message: res.error?.message || 'Toggle failed' })
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

      {!isAdmin && <Alert severity="info" sx={{ mb: 2 }}>Only ADMIN can install/uninstall modules. You can view installed.</Alert>}

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><Extension color="primary" /> Module Catalog</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Install modules per organization. Employee sees only installed+enabled modules in nav (real OS workspace).</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {catalog.map((mod) => {
          const inst = installed.find((i) => i.moduleKey === mod.key)
          const isInstalled = !!inst
          return (
            <Grid key={mod.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%', borderLeft: 4, borderColor: isInstalled ? (inst.enabled ? 'success.main' : 'warning.main') : 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{ICONS[mod.key] || '🧩'}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>{mod.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{mod.key} • v{mod.version}</Typography>
                    </Box>
                    {isInstalled && <Chip label={inst.enabled ? 'enabled' : 'disabled'} size="small" color={inst.enabled ? 'success' : 'default'} sx={{ height: 20 }} />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>{mod.description}</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  {!isInstalled ? (
                    <Button size="small" variant="contained" startIcon={<Add />} disabled={!isAdmin || actionId === mod.key} onClick={() => handleInstall(mod.key)}>
                      {actionId === mod.key ? 'Installing...' : 'Install'}
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PowerSettingsNew fontSize="small" color={inst.enabled ? 'success' : 'disabled'} />
                        <Typography variant="caption">Enabled</Typography>
                        <Switch checked={!!inst.enabled} onChange={(e) => handleToggle(mod.key, e.target.checked)} disabled={!isAdmin || actionId === mod.key} size="small" />
                      </Box>
                      <Button size="small" color="error" startIcon={<Delete />} disabled={!isAdmin || actionId === mod.key} onClick={() => handleUninstall(mod.key)}>Uninstall</Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {installed.length > 0 && (
        <Card><CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Installed in this organization ({installed.length})</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {installed.map((im) => <Chip key={im.moduleKey} label={`${im.moduleName} ${im.enabled ? '✓' : '○'}`} color={im.enabled ? 'success' : 'default'} variant={im.enabled ? 'filled' : 'outlined'} />)}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Enabled modules appear in AppLayout nav for every member (employee workspace).</Typography>
        </CardContent></Card>
      )}
    </Box>
  )
}
