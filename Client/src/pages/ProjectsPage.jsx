import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import { Add, Edit, Delete, Refresh, Folder } from '@mui/icons-material'
import { api } from '../api/client'
import { useOrganisation } from '../contexts/OrganisationContext'

export default function ProjectsPage() {
  const { organisationId } = useParams()
  const orgId = Number(organisationId)
  const { activeId } = useOrganisation()
  const effectiveOrgId = orgId || activeId

  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [projects, setProjects] = useState([])
  const [myPerms, setMyPerms] = useState([])
  const [myMembership, setMyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snack, setSnack] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'ACTIVE' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = (myMembership?.roleName || '').toUpperCase() === 'ADMIN'
  const has = (c) => myPerms.includes(c)
  const canRead = isAdmin || has('projects.read')
  const canCreate = isAdmin || has('projects.create')
  const canUpdate = isAdmin || has('projects.update')
  const canDelete = isAdmin || has('projects.delete')

  const fetchPerms = useCallback(async () => {
    if (!effectiveOrgId) return
    const [permRes, meRes] = await Promise.all([api.getMyPermissions(effectiveOrgId), api.getMyMembership(effectiveOrgId)])
    if (permRes.status === 200) setMyPerms(permRes.data)
    if (meRes.status === 200) setMyMembership(meRes.data)
  }, [effectiveOrgId])

  const fetchTeams = useCallback(async () => {
    if (!effectiveOrgId) return
    const res = await api.listTeams(effectiveOrgId)
    if (res.status === 200 && Array.isArray(res.data)) {
      setTeams(res.data)
      if (res.data.length && !selectedTeam) setSelectedTeam(String(res.data[0].id))
    }
  }, [effectiveOrgId, selectedTeam])

  const fetchProjects = useCallback(async () => {
    if (!effectiveOrgId || !selectedTeam || !canRead) { setLoading(false); return }
    setLoading(true); setError(null)
    const res = await api.listProjects(effectiveOrgId, Number(selectedTeam))
    if (res.status === 200 && Array.isArray(res.data)) setProjects(res.data)
    else if (res.status === 403) setError('You lack permission: projects.read')
    else setError(res.error?.message || `Failed to load projects (${res.status})`)
    setLoading(false)
  }, [effectiveOrgId, selectedTeam, canRead])

  useEffect(() => { fetchPerms(); fetchTeams() }, [fetchPerms, fetchTeams])
  useEffect(() => { fetchProjects() }, [fetchProjects])

  function openCreate() { setEditing(null); setForm({ name: '', description: '', status: 'ACTIVE' }); setFormError(null); setDialogOpen(true) }
  function openEdit(p) { setEditing(p); setForm({ name: p.name, description: p.description || '', status: p.status }); setFormError(null); setDialogOpen(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSubmitting(true); setFormError(null)
    const payload = { name: form.name.trim(), description: form.description.trim() || null, status: form.status }
    const res = editing ? await api.updateProject(effectiveOrgId, Number(selectedTeam), editing.id, payload) : await api.createProject(effectiveOrgId, Number(selectedTeam), payload)
    setSubmitting(false)
    if ((editing && res.status === 200) || (!editing && res.status === 201)) {
      setDialogOpen(false); setSnack({ severity: 'success', message: editing ? 'Project updated' : 'Project created' }); fetchProjects(); return
    }
    setFormError(res.error?.message || res.error?.errors?.name || 'Failed')
  }

  async function handleDelete(p) {
    if (!confirm(`Delete project "${p.name}"?`)) return
    const res = await api.deleteProject(effectiveOrgId, Number(selectedTeam), p.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Project deleted' }); fetchProjects() }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed' })
  }

  if (!effectiveOrgId) return <Alert severity="warning">Select an organization first.</Alert>
  if (!canRead) return <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}><Alert severity="info">You lack permission: projects.read (ADMIN/MANAGER/EMPLOYEE have it)</Alert></Box>

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Folder color="primary" />
        <Typography variant="h4" fontWeight={700}>Projects</Typography>
        <Chip label={`org #${effectiveOrgId}`} size="small" variant="outlined" />
      </Box>

      <Card sx={{ mb: 2 }}><CardContent>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Team</InputLabel>
            <Select value={selectedTeam} label="Team" onChange={(e) => setSelectedTeam(e.target.value)}>
              {teams.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name} ({t.memberCount})</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refresh"><IconButton size="small" onClick={fetchProjects}><Refresh /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create project</Button>}
          <Button component={Link} to={`/organizations/${effectiveOrgId}`} variant="outlined" size="small">Back to org</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          : projects.length === 0 ? <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}><Typography variant="body2">No projects in this team. {canCreate && 'Create one.'}</Typography></Box>
          : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell><TableCell>Description</TableCell><TableCell>Created</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                    <TableCell><Chip label={p.status} size="small" color={p.status === 'COMPLETED' ? 'success' : p.status === 'ACTIVE' ? 'primary' : 'default'} sx={{ height: 20 }} /></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{p.description || '-'}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {canUpdate && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p)}><Delete fontSize="small" /></IconButton></Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update project' : 'Create project'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Name *" fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={submitting} />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={submitting} />
            <FormControl size="small" fullWidth><InputLabel>Status</InputLabel><Select value={form.status} label="Status" onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><MenuItem value="PLANNING">Planning</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="COMPLETED">Completed</MenuItem><MenuItem value="ARCHIVED">Archived</MenuItem></Select></FormControl>
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
