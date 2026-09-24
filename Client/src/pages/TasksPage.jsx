import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import { Add, Edit, Delete, Refresh, Task } from '@mui/icons-material'
import { api } from '../api/client'
import { useOrganisation } from '../contexts/OrganisationContext'

export default function TasksPage() {
  const { organisationId } = useParams()
  const orgId = Number(organisationId)
  const { activeId } = useOrganisation()
  const effectiveOrgId = orgId || activeId

  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [myPerms, setMyPerms] = useState([])
  const [myMembership, setMyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snack, setSnack] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: '' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = (myMembership?.roleName || '').toUpperCase() === 'ADMIN'
  const has = (code) => myPerms.includes(code)
  const canRead = isAdmin || has('tasks.read')
  const canCreate = isAdmin || has('tasks.create')
  const canUpdate = isAdmin || has('tasks.update')
  const canDelete = isAdmin || has('tasks.delete')
  const canAssign = isAdmin || has('tasks.assign')

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

  const fetchTasks = useCallback(async () => {
    if (!effectiveOrgId || !selectedTeam || !canRead) { setLoading(false); return }
    setLoading(true); setError(null)
    const res = await api.listTasks(effectiveOrgId, Number(selectedTeam))
    if (res.status === 200 && Array.isArray(res.data)) setTasks(res.data)
    else if (res.status === 403) setError('You lack permission: tasks.read')
    else setError(res.error?.message || `Failed to load tasks (${res.status})`)
    setLoading(false)
  }, [effectiveOrgId, selectedTeam, canRead])

  const fetchMembers = useCallback(async () => {
    if (!effectiveOrgId) return
    const res = await api.listOrganizationUsers(effectiveOrgId)
    if (res.status === 200) setMembers(res.data)
  }, [effectiveOrgId])

  useEffect(() => { fetchPerms(); fetchTeams(); fetchMembers() }, [fetchPerms, fetchTeams, fetchMembers])
  useEffect(() => { fetchTasks() }, [fetchTasks])

  function openCreate() {
    setEditing(null); setForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: '' }); setFormError(null); setDialogOpen(true)
  }
  function openEdit(t) {
    setEditing(t); setForm({ title: t.title, description: t.description || '', status: t.status, priority: t.priority, assigneeId: t.assigneeId ? String(t.assigneeId) : '' }); setFormError(null); setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Title is required'); return }
    setSubmitting(true); setFormError(null)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
    }

    const res = editing
      ? await api.updateTask(effectiveOrgId, Number(selectedTeam), editing.id, payload)
      : await api.createTask(effectiveOrgId, Number(selectedTeam), payload)
    setSubmitting(false)
    if ((editing && res.status === 200) || (!editing && res.status === 201)) {
      setDialogOpen(false); setSnack({ severity: 'success', message: editing ? 'Task updated' : 'Task created' }); fetchTasks(); return
    }
    setFormError(res.error?.message || res.error?.errors?.title || 'Failed')
  }

  async function handleDelete(t) {
    if (!confirm(`Delete task "${t.title}"?`)) return
    const res = await api.deleteTask(effectiveOrgId, Number(selectedTeam), t.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Task deleted' }); fetchTasks() }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed' })
  }

  async function handleAssign(t, userId) {
    const res = await api.assignTask(effectiveOrgId, Number(selectedTeam), t.id, Number(userId))
    if (res.status === 200) { setSnack({ severity: 'success', message: 'Assigned' }); fetchTasks() }
    else setSnack({ severity: 'error', message: res.error?.message || 'Assign failed' })
  }

  if (!effectiveOrgId) return <Alert severity="warning">Select an organization first.</Alert>
  if (!canRead) return <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}><Alert severity="info">You lack permission: tasks.read (ADMIN/MANAGER/EMPLOYEE have it)</Alert></Box>

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Task color="primary" />
        <Typography variant="h4" fontWeight={700}>Tasks</Typography>
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
          <Tooltip title="Refresh"><IconButton size="small" onClick={fetchTasks}><Refresh /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create task</Button>}
          <Button component={Link} to={`/organizations/${effectiveOrgId}`} variant="outlined" size="small">Back to org</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          : tasks.length === 0 ? <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}><Typography variant="body2">No tasks in this team. {canCreate && 'Create one.'}</Typography></Box>
          : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Status</TableCell><TableCell>Priority</TableCell><TableCell>Assignee</TableCell><TableCell>Created</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                      {t.description && <Typography variant="caption" color="text.secondary">{t.description}</Typography>}
                    </TableCell>
                    <TableCell><Chip label={t.status} size="small" color={t.status === 'DONE' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'default'} sx={{ height: 20 }} /></TableCell>
                    <TableCell><Chip label={t.priority} size="small" variant="outlined" sx={{ height: 20 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">{t.assigneeName || '—'}</Typography>
                        {canAssign && (
                          <Select size="small" value="" displayEmpty onChange={(e) => handleAssign(t, e.target.value)} sx={{ minWidth: 120, height: 28 }}>
                            <MenuItem value="" disabled>Assign...</MenuItem>
                            {members.map((m) => <MenuItem key={m.userId} value={String(m.userId)}>{m.firstName} {m.lastName}</MenuItem>)}
                          </Select>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="caption">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {canUpdate && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(t)}><Delete fontSize="small" /></IconButton></Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update task' : 'Create task'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Title *" fullWidth value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} disabled={submitting} />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={submitting} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" fullWidth><InputLabel>Status</InputLabel><Select value={form.status} label="Status" onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><MenuItem value="TODO">TODO</MenuItem><MenuItem value="IN_PROGRESS">In Progress</MenuItem><MenuItem value="DONE">Done</MenuItem></Select></FormControl>
              <FormControl size="small" fullWidth><InputLabel>Priority</InputLabel><Select value={form.priority} label="Priority" onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}><MenuItem value="LOW">Low</MenuItem><MenuItem value="MEDIUM">Medium</MenuItem><MenuItem value="HIGH">High</MenuItem></Select></FormControl>
            </Box>
            <FormControl size="small" fullWidth><InputLabel>Assignee (optional)</InputLabel><Select value={form.assigneeId} label="Assignee (optional)" onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}><MenuItem value="">Unassigned</MenuItem>{members.map((m) => <MenuItem key={m.userId} value={String(m.userId)}>{m.firstName} {m.lastName} ({m.email})</MenuItem>)}</Select></FormControl>
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
