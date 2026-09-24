import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel, Link as MuiLink
} from '@mui/material'
import { Add, Edit, Delete, Refresh, Description, Link as LinkIcon } from '@mui/icons-material'
import { api } from '../api/client'
import { useOrganisation } from '../contexts/OrganisationContext'

export default function DocumentsPage() {
  const { organisationId } = useParams()
  const orgId = Number(organisationId)
  const { activeId } = useOrganisation()
  const effectiveOrgId = orgId || activeId

  const [teams, setTeams] = useState([])
  const [filterTeam, setFilterTeam] = useState('')
  const [docs, setDocs] = useState([])
  const [myPerms, setMyPerms] = useState([])
  const [myMembership, setMyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snack, setSnack] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', fileUrl: '', mimeType: '', sizeBytes: '', teamId: '' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = (myMembership?.roleName || '').toUpperCase() === 'ADMIN'
  const has = (c) => myPerms.includes(c)
  const canRead = isAdmin || has('documents.read')
  const canCreate = isAdmin || has('documents.create')
  const canUpdate = isAdmin || has('documents.update')
  const canDelete = isAdmin || has('documents.delete')

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

  const fetchDocs = useCallback(async () => {
    if (!effectiveOrgId || !canRead) { setLoading(false); return }
    setLoading(true); setError(null)
    const res = await api.listDocuments(effectiveOrgId, filterTeam ? Number(filterTeam) : null)
    if (res.status === 200 && Array.isArray(res.data)) setDocs(res.data)
    else if (res.status === 403) setError('You lack permission: documents.read')
    else setError(res.error?.message || `Failed to load documents (${res.status})`)
    setLoading(false)
  }, [effectiveOrgId, filterTeam, canRead])

  useEffect(() => { fetchPerms(); fetchTeams() }, [fetchPerms, fetchTeams])
  useEffect(() => { fetchDocs() }, [fetchDocs])

  function openCreate() { setEditing(null); setForm({ name: '', description: '', fileUrl: '', mimeType: '', sizeBytes: '', teamId: filterTeam || '' }); setFormError(null); setDialogOpen(true) }
  function openEdit(d) { setEditing(d); setForm({ name: d.name, description: d.description || '', fileUrl: d.fileUrl, mimeType: d.mimeType || '', sizeBytes: d.sizeBytes ? String(d.sizeBytes) : '', teamId: d.teamId ? String(d.teamId) : '' }); setFormError(null); setDialogOpen(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required'); return }
    if (!form.fileUrl.trim()) { setFormError('File URL is required'); return }
    try { new URL(form.fileUrl.trim()); } catch { setFormError('File URL must be valid'); return }
    setSubmitting(true); setFormError(null)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      fileUrl: form.fileUrl.trim(),
      mimeType: form.mimeType.trim() || null,
      sizeBytes: form.sizeBytes ? Number(form.sizeBytes) : null,
      teamId: form.teamId ? Number(form.teamId) : null,
    }
    const res = editing ? await api.updateDocument(effectiveOrgId, editing.id, payload) : await api.createDocument(effectiveOrgId, payload)
    setSubmitting(false)
    if ((editing && res.status === 200) || (!editing && res.status === 201)) {
      setDialogOpen(false); setSnack({ severity: 'success', message: editing ? 'Document updated' : 'Document added' }); fetchDocs(); return
    }
    setFormError(res.error?.message || 'Failed')
  }

  async function handleDelete(d) {
    if (!confirm(`Delete document "${d.name}"?`)) return
    const res = await api.deleteDocument(effectiveOrgId, d.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Document deleted' }); fetchDocs() }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed' })
  }

  if (!effectiveOrgId) return <Alert severity="warning">Select an organization first.</Alert>
  if (!canRead) return <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}><Alert severity="info">You lack permission: documents.read (ADMIN/MANAGER/EMPLOYEE have it)</Alert></Box>

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Description color="primary" />
        <Typography variant="h4" fontWeight={700}>Documents</Typography>
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
          <Tooltip title="Refresh"><IconButton size="small" onClick={fetchDocs}><Refresh /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add document</Button>}
          <Button component={Link} to={`/organizations/${effectiveOrgId}`} variant="outlined" size="small">Back to org</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          : docs.length === 0 ? <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}><Typography variant="body2">No documents. {canCreate && 'Add one.'}</Typography></Box>
          : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>File</TableCell><TableCell>Team</TableCell><TableCell>Size</TableCell><TableCell>Uploaded</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{d.name}</Typography>
                      {d.description && <Typography variant="caption" color="text.secondary">{d.description}</Typography>}
                      {d.mimeType && <Chip label={d.mimeType} size="small" sx={{ height: 16, ml: 0.5 }} />}
                    </TableCell>
                    <TableCell>
                      <MuiLink href={d.fileUrl} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12 }}>
                        <LinkIcon fontSize="small" /> Open
                      </MuiLink>
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{d.fileUrl.slice(0, 40)}...</Typography>
                    </TableCell>
                    <TableCell><Chip label={d.teamName || 'Org-wide'} size="small" variant="outlined" sx={{ height: 20 }} /></TableCell>
                    <TableCell><Typography variant="caption">{d.sizeBytes ? `${(d.sizeBytes / 1024).toFixed(1)} KB` : '-'}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{d.uploadedByName}<br />{new Date(d.createdAt).toLocaleDateString()}</Typography></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {canUpdate && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(d)}><Edit fontSize="small" /></IconButton></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(d)}><Delete fontSize="small" /></IconButton></Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update document' : 'Add document'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Name *" fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={submitting} />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={submitting} />
            <TextField label="File URL *" fullWidth value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))} disabled={submitting} placeholder="https://..." helperText="Use direct link, S3, etc." />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="MIME type" fullWidth value={form.mimeType} onChange={(e) => setForm((f) => ({ ...f, mimeType: e.target.value }))} disabled={submitting} placeholder="application/pdf" />
              <TextField label="Size bytes" type="number" fullWidth value={form.sizeBytes} onChange={(e) => setForm((f) => ({ ...f, sizeBytes: e.target.value }))} disabled={submitting} />
            </Box>
            <FormControl size="small" fullWidth><InputLabel>Team (optional)</InputLabel><Select value={form.teamId} label="Team (optional)" onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}><MenuItem value="">Org-wide</MenuItem>{teams.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}</Select></FormControl>
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Add'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
