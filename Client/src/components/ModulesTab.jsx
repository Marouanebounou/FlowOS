import { useEffect, useState, useCallback } from 'react'
import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress, Chip, Switch, Grid, Divider, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip } from '@mui/material'
import { Extension, Add, Delete, PowerSettingsNew, Person, Group, PersonAdd } from '@mui/icons-material'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const ICONS = {
  tasks: '✓',
  projects: '📁',
  calendar: '📅',
  crm: '👥',
  documents: '📄',
}

export default function ModulesTab({ organisationId, isAdmin }) {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState([])
  const [installed, setInstalled] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [snack, setSnack] = useState(null)
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [moduleTeams, setModuleTeams] = useState({})
  const [respSelect, setRespSelect] = useState({})

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    const [catRes, instRes] = await Promise.all([api.listModules(), api.listInstalledModules(organisationId)])
    if (catRes.status === 200) setCatalog(catRes.data)
    else setError(catRes.error?.message || 'Failed to load catalog')
    if (instRes.status === 200) setInstalled(instRes.data)
    else if (instRes.status !== 200) setInstalled([])
    setLoading(false)
  }, [organisationId])

  const fetchMembersTeams = useCallback(async () => {
    const [memRes, teamRes] = await Promise.all([api.listOrganizationUsers(organisationId), api.listTeams(organisationId)])
    if (memRes.status === 200) setMembers(memRes.data)
    if (teamRes.status === 200) setTeams(teamRes.data)
  }, [organisationId])

  const fetchModuleTeams = useCallback(async () => {
    const map = {}
    for (const im of installed) {
      const res = await api.listModuleTeams(organisationId, im.moduleKey)
      if (res.status === 200) map[im.moduleKey] = res.data
    }
    setModuleTeams(map)
  }, [installed, organisationId])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchMembersTeams() }, [fetchMembersTeams])
  useEffect(() => { if (installed.length) fetchModuleTeams() }, [fetchModuleTeams])

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

  async function handleSetResponsable(key) {
    const userId = respSelect[key]
    if (!userId) return
    setActionId(key)
    const res = await api.setModuleResponsable(organisationId, key, Number(userId))
    setActionId(null)
    if (res.status === 200) {
      setSnack({ severity: 'success', message: `Responsable set for ${key}` })
      fetchAll()
    } else setSnack({ severity: 'error', message: res.error?.message || 'Failed to set responsable' })
  }

  async function handleAddTeam(key, teamId) {
    if (!teamId) return
    setActionId(key + teamId)
    const res = await api.addModuleTeam(organisationId, key, Number(teamId))
    setActionId(null)
    if (res.status === 200) {
      setSnack({ severity: 'success', message: `Team added to ${key}` })
      const r = await api.listModuleTeams(organisationId, key)
      if (r.status === 200) setModuleTeams((prev) => ({ ...prev, [key]: r.data }))
    } else setSnack({ severity: 'error', message: res.error?.message || 'Failed to add team' })
  }

  async function handleRemoveTeam(key, teamId) {
    setActionId(key + teamId)
    const res = await api.removeModuleTeam(organisationId, key, Number(teamId))
    setActionId(null)
    if (res.status === 204) {
      setSnack({ severity: 'success', message: `Team removed from ${key}` })
      setModuleTeams((prev) => ({ ...prev, [key]: (prev[key] || []).filter((t) => t.teamId !== Number(teamId)) }))
    } else setSnack({ severity: 'error', message: res.error?.message || 'Failed to remove' })
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

      {!isAdmin && <Alert severity="info" sx={{ mb: 2 }}>Only ADMIN can install/uninstall and set responsable. Responsable can manage teams for their module.</Alert>}

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><Extension color="primary" /> Module Catalog</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Admin installs and assigns a responsable per module. Responsable then adds teams/users.</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {catalog.map((mod) => {
          const inst = installed.find((i) => i.moduleKey === mod.key)
          const isInstalled = !!inst
          const isResponsable = inst && user && inst.responsableId === user.userId
          const canManageTeams = isAdmin || isResponsable
          const assigned = moduleTeams[mod.key] || []
          return (
            <Grid key={mod.key} size={{ xs: 12, md: 6 }}>
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
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{mod.description}</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  {!isInstalled ? (
                    <Button size="small" variant="contained" startIcon={<Add />} disabled={!isAdmin || actionId === mod.key} onClick={() => handleInstall(mod.key)}>
                      {actionId === mod.key ? 'Installing...' : 'Install'}
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PowerSettingsNew fontSize="small" color={inst.enabled ? 'success' : 'disabled'} />
                          <Typography variant="caption">Enabled</Typography>
                          <Switch checked={!!inst.enabled} onChange={(e) => handleToggle(mod.key, e.target.checked)} disabled={!isAdmin || actionId === mod.key} size="small" />
                        </Box>
                        <Button size="small" color="error" startIcon={<Delete />} disabled={!isAdmin || actionId === mod.key} onClick={() => handleUninstall(mod.key)}>Uninstall</Button>
                      </Box>

                      <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Person fontSize="small" color="primary" />
                          <Typography variant="subtitle2">Responsable</Typography>
                        </Box>
                        {inst.responsableName ? (
                          <Chip icon={<Person />} label={`${inst.responsableName} (${inst.responsableEmail})`} size="small" sx={{ mb: 1 }} />
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>No responsable assigned</Typography>
                        )}
                        {isAdmin && (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                              <InputLabel>Set responsable</InputLabel>
                              <Select value={respSelect[mod.key] || ''} label="Set responsable" onChange={(e) => setRespSelect((p) => ({ ...p, [mod.key]: e.target.value }))}>
                                {members.map((m) => <MenuItem key={m.userId} value={String(m.userId)}>{m.firstName} {m.lastName} ({m.email}) - {m.roleName}</MenuItem>)}
                              </Select>
                            </FormControl>
                            <Button size="small" variant="outlined" onClick={() => handleSetResponsable(mod.key)} disabled={!respSelect[mod.key] || actionId === mod.key}>Set</Button>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Group fontSize="small" color="primary" />
                          <Typography variant="subtitle2">Teams assigned ({assigned.length})</Typography>
                        </Box>
                        {assigned.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">No teams assigned. Responsable adds teams.</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                            {assigned.map((at) => (
                              <Chip key={at.teamId} label={at.teamName} size="small" onDelete={canManageTeams ? () => handleRemoveTeam(mod.key, at.teamId) : undefined} />
                            ))}
                          </Box>
                        )}
                        {canManageTeams && (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                              <InputLabel>Add team</InputLabel>
                              <Select defaultValue="" label="Add team" onChange={(e) => { if (e.target.value) handleAddTeam(mod.key, e.target.value) }} size="small">
                                {teams.filter((t) => !assigned.some((a) => a.teamId === t.id)).map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                            <Tooltip title="Responsable or ADMIN can add"><PersonAdd fontSize="small" color="disabled" /></Tooltip>
                          </Box>
                        )}
                      </Box>
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
            {installed.map((im) => <Chip key={im.moduleKey} label={`${im.moduleName} ${im.enabled ? '✓' : '○'}${im.responsableName ? ` • ${im.responsableName}` : ''}`} color={im.enabled ? 'success' : 'default'} variant={im.enabled ? 'filled' : 'outlined'} />)}
          </Box>
        </CardContent></Card>
      )}
    </Box>
  )
}
