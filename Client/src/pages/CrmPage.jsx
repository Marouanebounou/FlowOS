import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import { Add, Edit, Delete, Refresh, People } from '@mui/icons-material'
import { api } from '../api/client'
import { useOrganisation } from '../contexts/OrganisationContext'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CUSTOMER']
const STATUS_COLOR = { NEW: 'default', CONTACTED: 'info', QUALIFIED: 'warning', CUSTOMER: 'success' }

export default function CrmPage() {
  const { organisationId } = useParams()
  const orgId = Number(organisationId)
  const { activeId } = useOrganisation()
  const effectiveOrgId = orgId || activeId

  const [teams, setTeams] = useState([])
  const [filterTeam, setFilterTeam] = useState('')
  const [contacts, setContacts] = useState([])
  const [myPerms, setMyPerms] = useState([])
  const [myMembership, setMyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snack, setSnack] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', status: 'NEW', notes: '', teamId: '' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = (myMembership?.roleName || '').toUpperCase() === 'ADMIN'
  const has = (c) => myPerms.includes(c)
  const canRead = isAdmin || has('crm.read')
  const canCreate = isAdmin || has('crm.create')
  const canUpdate = isAdmin || has('crm.update')
  const canDelete = isAdmin || has('crm.delete')

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

  const fetchCrm = useCallback(async () => {
    if (!effectiveOrgId || !canRead) { setLoading(false); return }
    setLoading(true); setError(null)
    const res = await api.listCrm(effectiveOrgId, filterTeam ? Number(filterTeam) : null)
    if (res.status === 200 && Array.isArray(res.data)) setContacts(res.data)
    else if (res.status === 403) setError('You lack permission: crm.read')
    else setError(res.error?.message || `Failed to load CRM (${res.status})`)
    setLoading(false)
  }, [effectiveOrgId, filterTeam, canRead])

  useEffect(() => { fetchPerms(); fetchTeams() }, [fetchPerms, fetchTeams])
  useEffect(() => { fetchCrm() }, [fetchCrm])

  function openCreate() { setEditing(null); setForm({ name: '', email: '', phone: '', company: '', status: 'NEW', notes: '', teamId: filterTeam || '' }); setFormError(null); setDialogOpen(true) }
  function openEdit(c) { setEditing(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', status: c.status, notes: c.notes || '', teamId: c.teamId ? String(c.teamId) : '' }); setFormError(null); setDialogOpen(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSubmitting(true); setFormError(null)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
      teamId: form.teamId ? Number(form.teamId) : null,
    }
    const res = editing ? await api.updateCrmContact(effectiveOrgId, editing.id, payload) : await api.createCrmContact(effectiveOrgId, payload)
    setSubmitting(false)
    if ((editing && res.status === 200) || (!editing && res.status === 201)) {
      setDialogOpen(false); setSnack({ severity: 'success', message: editing ? 'Contact updated' : 'Contact created' }); fetchCrm(); return
    }
    setFormError(res.error?.message || 'Failed')
  }

  async function handleDelete(c) {
    if (!confirm(`Delete contact "${c.name}"?`)) return
    const res = await api.deleteCrmContact(effectiveOrgId, c.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Contact deleted' }); fetchCrm() }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed' })
  }

  if (!effectiveOrgId) return <Alert severity="warning">Select an organization first.</Alert>
  if (!canRead) return <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}><Alert severity="info">You lack permission: crm.read (ADMIN/MANAGER/EMPLOYEE have it)</Alert></Box>

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <People color="primary" />
        <Typography variant="h4" fontWeight={700}>CRM</Typography>
        <Chip label={`org #${effectiveOrgId}`} size="small" variant="outlined" />
      </Box>

      <Card sx={{ mb: 2 }}><CardContent>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by team</InputLabel>
            <Select value={filterTeam} label="Filter by team" onChange={(e) => setFilterTeam(e.target.value)}>
              <MenuItem value="">All teams</MenuItem>
              {teams.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refresh"><IconButton size="small" onClick={fetchCrm}><Refresh /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add contact</Button>}
          <Button component={Link} to={`/organizations/${effectiveOrgId}`} variant="outlined" size="small">Back to org</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          : contacts.length === 0 ? <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}><Typography variant="body2">No contacts. {canCreate && 'Add one.'}</Typography></Box>
          : (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {STATUSES.map((s) => {
                  const count = contacts.filter((c) => c.status === s).length
                  return <Chip key={s} label={`${s} (${count})`} color={STATUS_COLOR[s]} variant={s === 'CUSTOMER' ? 'filled' : 'outlined'} size="small" />
                })}
              </Box>
              <Table size="small">
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Company</TableCell><TableCell>Contact</TableCell><TableCell>Status</TableCell><TableCell>Team</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{c.name}</Typography><Typography variant="caption" color="text.secondary">{c.notes || ''}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{c.company || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{c.email || '-'}<br />{c.phone || ''}</Typography></TableCell>
                      <TableCell><Chip label={c.status} size="small" color={STATUS_COLOR[c.status]} sx={{ height: 20 }} /></TableCell>
                      <TableCell><Chip label={c.teamName || 'Org-wide'} size="small" variant="outlined" sx={{ height: 20 }} /></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {canUpdate && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton></Tooltip>}
                          {canDelete && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(c)}><Delete fontSize="small" /></IconButton></Tooltip>}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update contact' : 'Add contact'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Name *" fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={submitting} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={submitting} />
              <TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={submitting} />
            </Box>
            <TextField label="Company" fullWidth value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} disabled={submitting} />
            <FormControl size="small" fullWidth><InputLabel>Status</InputLabel><Select value={form.status} label="Status" onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><MenuItem value="NEW">New</MenuItem><MenuItem value="CONTACTED">Contacted</MenuItem><MenuItem value="QUALIFIED">Qualified</MenuItem><MenuItem value="CUSTOMER">Customer</MenuItem></Select></FormControl>
            <TextField label="Notes" fullWidth multiline minRows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} disabled={submitting} />
            <FormControl size="small" fullWidth><InputLabel>Team (optional)</InputLabel><Select value={form.teamId} label="Team (optional)" onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}><MenuItem value="">Org-wide</MenuItem>{teams.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}</Select></FormControl>
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
