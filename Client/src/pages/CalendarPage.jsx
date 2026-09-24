import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import { Add, Edit, Delete, Refresh, CalendarToday } from '@mui/icons-material'
import { api } from '../api/client'
import { useOrganisation } from '../contexts/OrganisationContext'

function toInputLocal(dt) {
  if (!dt) return ''

  return dt.slice(0, 16)
}

export default function CalendarPage() {
  const { organisationId } = useParams()
  const orgId = Number(organisationId)
  const { activeId } = useOrganisation()
  const effectiveOrgId = orgId || activeId

  const [teams, setTeams] = useState([])
  const [filterTeam, setFilterTeam] = useState('') 
  const [events, setEvents] = useState([])
  const [myPerms, setMyPerms] = useState([])
  const [myMembership, setMyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snack, setSnack] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', location: '', startAt: '', endAt: '', teamId: '' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = (myMembership?.roleName || '').toUpperCase() === 'ADMIN'
  const has = (c) => myPerms.includes(c)
  const canRead = isAdmin || has('calendar.read')
  const canCreate = isAdmin || has('calendar.create')
  const canUpdate = isAdmin || has('calendar.update')
  const canDelete = isAdmin || has('calendar.delete')

  const fetchPerms = useCallback(async () => {
    if (!effectiveOrgId) return
    const [permRes, meRes] = await Promise.all([api.getMyPermissions(effectiveOrgId), api.getMyMembership(effectiveOrgId)])
    if (permRes.status === 200) setMyPerms(permRes.data)
    if (meRes.status === 200) setMyMembership(meRes.data)
  }, [effectiveOrgId])

  const fetchTeams = useCallback(async () => {
    if (!effectiveOrgId) return
    const res = await api.listTeams(effectiveOrgId)
    if (res.status === 200) setTeams(res.data)
  }, [effectiveOrgId])

  const fetchEvents = useCallback(async () => {
    if (!effectiveOrgId || !canRead) { setLoading(false); return }
    setLoading(true); setError(null)
    const teamId = filterTeam ? Number(filterTeam) : null
    const res = await api.listCalendar(effectiveOrgId, teamId)
    if (res.status === 200 && Array.isArray(res.data)) setEvents(res.data)
    else if (res.status === 403) setError('You lack permission: calendar.read')
    else setError(res.error?.message || `Failed to load events (${res.status})`)
    setLoading(false)
  }, [effectiveOrgId, filterTeam, canRead])

  useEffect(() => { fetchPerms(); fetchTeams() }, [fetchPerms, fetchTeams])
  useEffect(() => { fetchEvents() }, [fetchEvents])

  function openCreate() {
    setEditing(null); setForm({ title: '', description: '', location: '', startAt: '', endAt: '', teamId: filterTeam || '' }); setFormError(null); setDialogOpen(true)
  }
  function openEdit(ev) {
    setEditing(ev)
    setForm({
      title: ev.title,
      description: ev.description || '',
      location: ev.location || '',
      startAt: toInputLocal(ev.startAt),
      endAt: toInputLocal(ev.endAt),
      teamId: ev.teamId ? String(ev.teamId) : '',
    })
    setFormError(null); setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Title is required'); return }
    if (!form.startAt) { setFormError('Start time is required'); return }
    if (!form.endAt) { setFormError('End time is required'); return }

    const startIso = new Date(form.startAt).toISOString().slice(0, 19)
    const endIso = new Date(form.endAt).toISOString().slice(0, 19)
    if (new Date(endIso) <= new Date(startIso)) { setFormError('End must be after start'); return }
    setSubmitting(true); setFormError(null)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      startAt: startIso,
      endAt: endIso,
      teamId: form.teamId ? Number(form.teamId) : null,
    }
    const res = editing ? await api.updateCalendarEvent(effectiveOrgId, editing.id, payload) : await api.createCalendarEvent(effectiveOrgId, payload)
    setSubmitting(false)
    if ((editing && res.status === 200) || (!editing && res.status === 201)) {
      setDialogOpen(false); setSnack({ severity: 'success', message: editing ? 'Event updated' : 'Event created' }); fetchEvents(); return
    }
    setFormError(res.error?.message || 'Failed')
  }

  async function handleDelete(ev) {
    if (!confirm(`Delete event "${ev.title}"?`)) return
    const res = await api.deleteCalendarEvent(effectiveOrgId, ev.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Event deleted' }); fetchEvents() }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed' })
  }

  if (!effectiveOrgId) return <Alert severity="warning">Select an organization first.</Alert>
  if (!canRead) return <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}><Alert severity="info">You lack permission: calendar.read (ADMIN/MANAGER/EMPLOYEE have it)</Alert></Box>

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <CalendarToday color="primary" />
        <Typography variant="h4" fontWeight={700}>Calendar</Typography>
        <Chip label={`org #${effectiveOrgId}`} size="small" variant="outlined" />
      </Box>

      <Card sx={{ mb: 2 }}><CardContent>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by team</InputLabel>
            <Select value={filterTeam} label="Filter by team" onChange={(e) => setFilterTeam(e.target.value)}>
              <MenuItem value="">All teams / org-wide</MenuItem>
              {teams.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refresh"><IconButton size="small" onClick={fetchEvents}><Refresh /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create event</Button>}
          <Button component={Link} to={`/organizations/${effectiveOrgId}`} variant="outlined" size="small">Back to org</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          : events.length === 0 ? <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}><Typography variant="body2">No events. {canCreate && 'Create one.'}</Typography></Box>
          : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Title</TableCell><TableCell>When</TableCell><TableCell>Team</TableCell><TableCell>Location</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{ev.title}</Typography>
                      {ev.description && <Typography variant="caption" color="text.secondary">{ev.description}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{new Date(ev.startAt).toLocaleString()} →<br />{new Date(ev.endAt).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell><Chip label={ev.teamName || 'Org-wide'} size="small" variant="outlined" sx={{ height: 20 }} /></TableCell>
                    <TableCell><Typography variant="caption">{ev.location || '-'}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {canUpdate && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(ev)}><Edit fontSize="small" /></IconButton></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(ev)}><Delete fontSize="small" /></IconButton></Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update event' : 'Create event'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Title *" fullWidth value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} disabled={submitting} />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={submitting} />
            <TextField label="Location" fullWidth value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} disabled={submitting} />
            <TextField label="Start *" type="datetime-local" fullWidth value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} disabled={submitting} InputLabelProps={{ shrink: true }} />
            <TextField label="End *" type="datetime-local" fullWidth value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} disabled={submitting} InputLabelProps={{ shrink: true }} />
            <FormControl size="small" fullWidth><InputLabel>Team (optional)</InputLabel><Select value={form.teamId} label="Team (optional)" onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}><MenuItem value="">Org-wide</MenuItem>{teams.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}</Select></FormControl>
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
