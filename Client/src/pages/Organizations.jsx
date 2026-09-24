import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Snackbar, Grid, Chip, Avatar, CircularProgress, InputAdornment, Divider, IconButton
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Business, Add, Search, Groups, ArrowOutward, Palette } from '@mui/icons-material'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useOrganisation } from '../contexts/OrganisationContext'

function isValidUrl(v) { try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }
function isValidColor(v) { return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(v) || /^[a-z]+$/i.test(v) }
function validate(form) {
  const e = {}
  if (!form.name.trim()) e.name = 'Organisation name is required'
  else if (form.name.trim().length > 255) e.name = 'Max 255 characters'
  if (form.logoUrl && form.logoUrl.trim().length > 500) e.logoUrl = 'Max 500 characters'
  if (form.logoUrl && form.logoUrl.trim() && !isValidUrl(form.logoUrl.trim())) e.logoUrl = 'Must be valid URL (https://...)'
  if (form.primaryColor && form.primaryColor.trim().length > 20) e.primaryColor = 'Max 20 characters'
  if (form.primaryColor && form.primaryColor.trim() && !isValidColor(form.primaryColor.trim())) e.primaryColor = 'Valid hex like #6366f1'
  return e
}

export default function Organizations() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { organizations: ctxOrgs, loading: ctxLoading, refresh, select } = useOrganisation()
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState([])
  const [q, setQ] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', logoUrl: '', primaryColor: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  async function fetchOrganizations() {
    setLoadingList(true); setListError(null)
    const result = await api.listOrganizations()
    if (result.status === 200 && Array.isArray(result.data)) setOrganizations(result.data)
    else if (result.status === 401) setListError('Session expired - please sign in again')
    else if (result.error) setListError(result.error.message || `Failed to load (${result.status})`)
    setLoadingList(false)
  }

  useEffect(() => {
    if (!ctxLoading && ctxOrgs.length > 0) { setOrganizations(ctxOrgs); setLoadingList(false); setListError(null) }
  }, [ctxOrgs, ctxLoading])

  useEffect(() => {
    if (authLoading || ctxLoading) return
    if (!isAuthenticated) { setLoadingList(false); setListError('Not authenticated - please sign in'); return }
    if (ctxOrgs.length > 0) return
    fetchOrganizations()
  }, [authLoading, ctxLoading, isAuthenticated])

  const filtered = organizations.filter((o) => !q.trim() || o.name.toLowerCase().includes(q.toLowerCase()))

  function handleOpen() { setForm({ name: '', logoUrl: '', primaryColor: '' }); setFieldErrors({}); setSubmitError(null); setOpen(true) }
  function handleClose() { if (submitting) return; setOpen(false) }
  function updateField(f) { return (e) => setForm((p) => ({ ...p, [f]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setSubmitError(null)
    const errs = validate(form); setFieldErrors(errs); if (Object.keys(errs).length) return
    setSubmitting(true)
    const payload = { name: form.name.trim(), logoUrl: form.logoUrl.trim() || null, primaryColor: form.primaryColor.trim() || null }
    const result = await api.createOrganization(payload)
    setSubmitting(false)
    if (result.status === 201 && result.data) {
      setOpen(false); setSnackbar({ open: true, message: `Organization "${result.data.name}" created`, severity: 'success' })
      select(result.data.id); refresh(); setOrganizations((prev) => [result.data, ...prev]); navigate(`/organizations/${result.data.id}`); return
    }
    if (result.status === 400 && result.error) {
      if (result.error.errors) { const be = {}; Object.entries(result.error.errors).forEach(([k, v]) => be[k] = Array.isArray(v) ? v.join(', ') : v); setFieldErrors(be) }
      setSubmitError(result.error.message || 'Validation failed'); return
    }
    setSubmitError(result.error?.message || 'Failed to create organization')
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 1 }}>
      <Box sx={{ mb: 3, p: { xs: 2.5, md: 3 }, borderRadius: 3, background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'relative', display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.03em' }}>Organizations</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{organizations.length ? `${organizations.length} workspace${organizations.length > 1 ? 's' : ''} • switch in top bar` : 'Create your first workspace to invite your team'}</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpen} sx={{ bgcolor: 'white', color: '#4f46e5', fontWeight: 700, px: 2.5, '&:hover': { bgcolor: '#f1f5f9' }, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
            Create Organization
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2.5, p: 1.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField placeholder="Search organizations..." value={q} onChange={(e) => setQ(e.target.value)} size="small" sx={{ minWidth: 260, flex: 1, maxWidth: 380 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }} />
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip icon={<Groups sx={{ fontSize: 14 }} />} label={`${filtered.length} shown`} size="small" sx={{ bgcolor: 'grey.100' }} />
          <Button size="small" variant="outlined" onClick={handleOpen} startIcon={<Add />} sx={{ display: { xs: 'none', sm: 'flex' } }}>New</Button>
        </Box>
      </Card>

      {loadingList ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : listError ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{listError}</Alert>
      ) : filtered.length === 0 ? (
        <Card sx={{ border: '1px dashed #e2e8f0', bgcolor: 'grey.50', textAlign: 'center', py: 6 }}>
          <CardContent>
            <Box sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <Business sx={{ fontSize: 28, color: 'text.disabled' }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>{organizations.length === 0 ? 'No organizations yet' : 'No matches'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 360, mx: 'auto' }}>
              {organizations.length === 0 ? 'You are not a member of any organization yet. Create one to get started and invite your team.' : `No organization matches "${q}". Try another search.`}
            </Typography>
            {organizations.length === 0 && <Button variant="contained" startIcon={<Add />} onClick={handleOpen} sx={{ borderRadius: 2 }}>Create Organization</Button>}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((org) => (
            <Grid key={org.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                onClick={() => { select(org.id); navigate(`/organizations/${org.id}`) }}
                sx={{
                  height: '100%', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 20px -5px rgb(0 0 0 / 0.08)', borderColor: '#cbd5e1' },
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box sx={{ height: 4, bgcolor: org.primaryColor || '#6366f1' }} />
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                    <Avatar src={org.logoUrl || undefined} sx={{ bgcolor: org.primaryColor || '#6366f1', width: 44, height: 44, fontWeight: 700, fontSize: 14, border: '2px solid #f1f5f9' }}>
                      {!org.logoUrl && org.name.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ letterSpacing: '-0.01em' }}>{org.name}</Typography>
                      <Typography variant="caption" color="text.secondary">#{org.id} • {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : ''}</Typography>
                    </Box>
                    <IconButton size="small" sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }} onClick={(e) => { e.stopPropagation(); select(org.id); navigate(`/organizations/${org.id}`) }}>
                      <ArrowOutward sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {org.primaryColor && <Chip icon={<Palette sx={{ fontSize: 12 }} />} label={org.primaryColor} size="small" sx={{ height: 22, fontSize: 11, bgcolor: org.primaryColor, color: 'white', fontWeight: 600, border: '1px solid rgba(0,0,0,0.08)' }} />}
                    <Chip label="Active" size="small" variant="outlined" sx={{ height: 22, fontSize: 11, bgcolor: 'white' }} />
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Open workspace →</Typography>
                    <Typography variant="caption" color="text.secondary">{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : ''}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ height: 3, background: 'linear-gradient(90deg,#6366f1 0%,#06b6d4 100%)' }} />
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Create Organization</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {submitError && <Alert severity="error" sx={{ borderRadius: 2 }}>{submitError}</Alert>}
            <TextField label="Organisation name *" fullWidth autoFocus value={form.name} onChange={updateField('name')} error={!!fieldErrors.name} helperText={fieldErrors.name || 'Required, max 255 chars'} disabled={submitting} placeholder="Acme Corp" />
            <TextField label="Logo URL" fullWidth value={form.logoUrl} onChange={updateField('logoUrl')} error={!!fieldErrors.logoUrl} helperText={fieldErrors.logoUrl || 'Optional, e.g. https://example.com/logo.png'} disabled={submitting} placeholder="https://..." />
            <TextField label="Primary color" fullWidth value={form.primaryColor} onChange={updateField('primaryColor')} error={!!fieldErrors.primaryColor} helperText={fieldErrors.primaryColor || 'Optional, hex like #6366f1'} disabled={submitting} placeholder="#6366f1" slotProps={{ input: { endAdornment: form.primaryColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(form.primaryColor.trim()) ? <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: form.primaryColor.trim(), border: '1px solid #e2e8f0', ml: 1 }} /> : null } }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleClose} disabled={submitting} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ borderRadius: 2, px: 3, background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)' }}>{submitting ? 'Creating...' : 'Create'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
