import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Business, Add } from '@mui/icons-material'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useOrganisation } from '../contexts/OrganisationContext'

function validateCreateForm(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Organisation name is required'
  else if (form.name.trim().length > 255) errors.name = 'Organisation name must not exceed 255 characters'
  if (form.logoUrl && form.logoUrl.trim().length > 500) errors.logoUrl = 'Logo URL must not exceed 500 characters'
  if (form.logoUrl && form.logoUrl.trim() && !isValidUrl(form.logoUrl.trim())) errors.logoUrl = 'Logo URL must be a valid URL (https://...)'
  if (form.primaryColor && form.primaryColor.trim().length > 20) errors.primaryColor = 'Primary color must not exceed 20 characters'
  if (form.primaryColor && form.primaryColor.trim() && !isValidColor(form.primaryColor.trim())) errors.primaryColor = 'Use a valid hex color like #4F46E5'
  return errors
}

function isValidUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidColor(value) {
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(value) || /^[a-z]+$/i.test(value)
}

export default function Organizations() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { organizations: ctxOrgs, loading: ctxLoading, refresh, select } = useOrganisation()
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', logoUrl: '', primaryColor: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  async function fetchOrganizations() {
    setLoadingList(true)
    setListError(null)
    const result = await api.listOrganizations()
    if (result.status === 200 && Array.isArray(result.data)) {
      setOrganizations(result.data)
    } else if (result.status === 401) {
      setListError('Session expired - please sign in again')
    } else if (result.error) {
      setListError(result.error.message || `Failed to load organizations (${result.status})`)
    }
    setLoadingList(false)
  }

  // sync with context when it loads
  useEffect(() => {
    if (!ctxLoading && ctxOrgs.length > 0) {
      setOrganizations(ctxOrgs)
      setLoadingList(false)
      setListError(null)
    }
  }, [ctxOrgs, ctxLoading])

  useEffect(() => {
    if (authLoading || ctxLoading) return
    if (!isAuthenticated) {
      setLoadingList(false)
      setListError('Not authenticated - please sign in')
      return
    }
    // if context already has data, avoid duplicate fetch
    if (ctxOrgs.length > 0) return
    fetchOrganizations()
  }, [authLoading, ctxLoading, isAuthenticated])

  function handleOpen() {
    setForm({ name: '', logoUrl: '', primaryColor: '' })
    setFieldErrors({})
    setSubmitError(null)
    setOpen(true)
  }

  function handleClose() {
    if (submitting) return
    setOpen(false)
  }

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError(null)
    const errors = validateCreateForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    const payload = {
      name: form.name.trim(),
      logoUrl: form.logoUrl.trim() || null,
      primaryColor: form.primaryColor.trim() || null,
    }

    const result = await api.createOrganization(payload)
    setSubmitting(false)

    if (result.status === 201 && result.data) {
      setOpen(false)
      setSnackbar({ open: true, message: `Organization "${result.data.name}" created`, severity: 'success' })
      // update context + local list and auto-select
      select(result.data.id)
      refresh()
      setOrganizations((prev) => [result.data, ...prev])
      navigate(`/organizations/${result.data.id}`)
      return
    }

    // Handle validation errors from backend (400 with errors map)
    if (result.status === 400 && result.error) {
      if (result.error.errors) {
        // Spring validation: {field: message} or array?
        const backendErrors = {}
        Object.entries(result.error.errors).forEach(([k, v]) => {
          backendErrors[k] = Array.isArray(v) ? v.join(', ') : v
        })
        setFieldErrors(backendErrors)
      }
      setSubmitError(result.error.message || 'Validation failed')
      return
    }

    setSubmitError(result.error?.message || 'Failed to create organization')
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Organizations
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Your Organizations</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
              Create Organization
            </Button>
          </Box>

          {loadingList ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : listError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {listError}
            </Alert>
          ) : organizations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <Business sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                You are not a member of any organization yet.
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Create an organization to get started.
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
                Create Organization
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {organizations.map((org) => (
                <Grid key={org.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    variant="outlined"
                    onClick={() => { select(org.id); navigate(`/organizations/${org.id}`) }}
                    sx={{ height: '100%', borderLeft: 4, borderColor: org.primaryColor || 'primary.main', cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                        <Avatar
                          src={org.logoUrl || undefined}
                          sx={{ bgcolor: org.primaryColor || 'primary.main', width: 40, height: 40 }}
                        >
                          {!org.logoUrl && <Business fontSize="small" />}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {org.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{org.id} • {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : ''}
                          </Typography>
                        </Box>
                      </Box>
                      {org.primaryColor && (
                        <Chip
                          label={org.primaryColor}
                          size="small"
                          sx={{ bgcolor: org.primaryColor, color: '#fff', height: 20 }}
                        />
                      )}
                      <Button size="small" sx={{ mt: 1 }} onClick={(e) => { e.stopPropagation(); select(org.id); navigate(`/organizations/${org.id}`) }}>Open</Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Organization</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <TextField
              label="Organisation name *"
              fullWidth
              autoFocus
              value={form.name}
              onChange={updateField('name')}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name || 'Required, max 255 chars'}
              disabled={submitting}
              placeholder="Acme Corp"
            />
            <TextField
              label="Logo URL"
              fullWidth
              value={form.logoUrl}
              onChange={updateField('logoUrl')}
              error={!!fieldErrors.logoUrl}
              helperText={fieldErrors.logoUrl || 'Optional, e.g. https://example.com/logo.png'}
              disabled={submitting}
              placeholder="https://..."
            />
            <TextField
              label="Primary color"
              fullWidth
              value={form.primaryColor}
              onChange={updateField('primaryColor')}
              error={!!fieldErrors.primaryColor}
              helperText={fieldErrors.primaryColor || 'Optional, hex like #4F46E5'}
              disabled={submitting}
              placeholder="#4F46E5"
              slotProps={{
                input: {
                  endAdornment: form.primaryColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(form.primaryColor.trim()) ? (
                    <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: form.primaryColor.trim(), border: 1, borderColor: 'divider', ml: 1 }} />
                  ) : null,
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
