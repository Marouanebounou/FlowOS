import { useState } from 'react'
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { Save, DeleteForever } from '@mui/icons-material'
import { api } from '../api/client'
import { useOrganisation } from '../contexts/OrganisationContext'

export default function SettingsTab({ organisation, onUpdated, onDeleted }) {
  const { refresh } = useOrganisation()
  // details form (PUT) - name required + logoUrl
  const [details, setDetails] = useState({ name: organisation.name || '', logoUrl: organisation.logoUrl || '' })
  const [detailsError, setDetailsError] = useState(null)
  const [detailsSuccess, setDetailsSuccess] = useState(null)
  const [detailsSaving, setDetailsSaving] = useState(false)

  // branding form (PATCH) - name, logoUrl, primaryColor (hex)
  const [branding, setBranding] = useState({ name: '', logoUrl: '', primaryColor: '' })
  const [brandingError, setBrandingError] = useState(null)
  const [brandingSuccess, setBrandingSuccess] = useState(null)
  const [brandingSaving, setBrandingSaving] = useState(false)

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const requiredPhrase = `delete ${organisation.name}`

  async function handleDetailsSave(e) {
    e.preventDefault()
    setDetailsError(null); setDetailsSuccess(null)
    if (!details.name.trim()) { setDetailsError('Organisation name is required'); return }
    if (details.name.trim().length > 255) { setDetailsError('Max 255 characters'); return }
    if (details.logoUrl && details.logoUrl.length > 500) { setDetailsError('Logo URL max 500'); return }
    setDetailsSaving(true)
    const res = await api.updateOrganization(organisation.id, { name: details.name.trim(), logoUrl: details.logoUrl.trim() || null })
    setDetailsSaving(false)
    if (res.status === 200 && res.data) {
      setDetailsSuccess('Details updated')
      onUpdated(res.data); refresh()
    } else {
      setDetailsError(res.error?.errors?.name || res.error?.message || `Failed (${res.status})`)
    }
  }

  async function handleBrandingSave(e) {
    e.preventDefault()
    setBrandingError(null); setBrandingSuccess(null)
    const payload = {}
    if (branding.name.trim()) {
      if (branding.name.trim().length > 255) { setBrandingError('Name max 255'); return }
      payload.name = branding.name.trim()
    }
    if (branding.logoUrl.trim()) {
      if (branding.logoUrl.trim().length > 500) { setBrandingError('Logo URL max 500'); return }
      payload.logoUrl = branding.logoUrl.trim()
    } else if (branding.logoUrl !== '' && branding.logoUrl === '') {
      // empty means clear? only send if user typed then cleared
    }
    if (branding.primaryColor.trim()) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(branding.primaryColor.trim())) { setBrandingError('Primary color must be #RRGGBB'); return }
      payload.primaryColor = branding.primaryColor.trim()
    }
    // allow clearing primaryColor with empty string -> backend pattern allows ^$ but we treat empty as not sent
    if (Object.keys(payload).length === 0) { setBrandingError('Nothing to update'); return }

    setBrandingSaving(true)
    const res = await api.updateOrganizationSettings(organisation.id, payload)
    setBrandingSaving(false)
    if (res.status === 200 && res.data) {
      setBrandingSuccess('Branding updated')
      onUpdated(res.data); refresh()
      setBranding({ name: '', logoUrl: '', primaryColor: '' })
    } else {
      setBrandingError(res.error?.message || `Failed (${res.status})`)
    }
  }

  async function handleDelete() {
    if (confirmText !== requiredPhrase) return
    setDeleting(true)
    const res = await api.deleteOrganization(organisation.id)
    setDeleting(false)
    if (res.status === 204) {
      onDeleted()
    } else {
      setDetailsError(res.error?.message || `Delete failed (${res.status})`)
      setDeleteOpen(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Details */}
      <Card><CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Organization details</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Update the name and logo for your organization.</Typography>
        <Box component="form" onSubmit={handleDetailsSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {detailsError && <Alert severity="error">{detailsError}</Alert>}
          {detailsSuccess && <Alert severity="success">{detailsSuccess}</Alert>}
          <TextField label="Name *" fullWidth value={details.name} onChange={(e) => setDetails((f) => ({ ...f, name: e.target.value }))} disabled={detailsSaving} />
          <TextField label="Logo URL" fullWidth value={details.logoUrl} onChange={(e) => setDetails((f) => ({ ...f, logoUrl: e.target.value }))} disabled={detailsSaving} placeholder="https://..." helperText="Max 500" />
          <Box><Button type="submit" variant="contained" startIcon={<Save />} disabled={detailsSaving}>{detailsSaving ? 'Saving...' : 'Save details'}</Button></Box>
        </Box>
      </CardContent></Card>

      {/* Branding */}
      <Card><CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Branding & settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Change organization name, logo and primary color.</Typography>
        <Box component="form" onSubmit={handleBrandingSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {brandingError && <Alert severity="error">{brandingError}</Alert>}
          {brandingSuccess && <Alert severity="success">{brandingSuccess}</Alert>}
          <TextField label="Name (optional)" fullWidth value={branding.name} onChange={(e) => setBranding((f) => ({ ...f, name: e.target.value }))} disabled={brandingSaving} placeholder={organisation.name} />
          <TextField label="Logo URL (optional)" fullWidth value={branding.logoUrl} onChange={(e) => setBranding((f) => ({ ...f, logoUrl: e.target.value }))} disabled={brandingSaving} placeholder={organisation.logoUrl || 'https://...'} />
          <TextField label="Primary color (optional) #RRGGBB" fullWidth value={branding.primaryColor} onChange={(e) => setBranding((f) => ({ ...f, primaryColor: e.target.value }))} disabled={brandingSaving} placeholder={organisation.primaryColor || '#4F46E5'} helperText="e.g. #1E6F5C" slotProps={{ input: { endAdornment: branding.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(branding.primaryColor.trim()) ? <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: branding.primaryColor.trim(), border: 1, borderColor: 'divider', ml: 1 }} /> : null } }} />
          <Box><Button type="submit" variant="outlined" startIcon={<Save />} disabled={brandingSaving}>{brandingSaving ? 'Saving...' : 'Update branding'}</Button></Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2">Current:</Typography>
          <Typography variant="body2" fontWeight={600}>{organisation.name}</Typography>
          {organisation.primaryColor && <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: organisation.primaryColor, border: 1, borderColor: 'divider' }} />}
          <Typography variant="caption" color="text.secondary">{organisation.primaryColor || 'no color'}</Typography>
        </Box>
      </CardContent></Card>

      {/* Danger zone */}
      <Card sx={{ border: 1, borderColor: 'error.main' }}><CardContent>
        <Typography variant="h6" fontWeight={700} color="error" sx={{ mb: 1 }}>Danger zone</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Permanently delete this organization and all its data. This cannot be undone.</Typography>
        <Button variant="contained" color="error" startIcon={<DeleteForever />} onClick={() => setDeleteOpen(true)}>Delete organization</Button>
      </CardContent></Card>

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error">Delete {organisation.name}?</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="error">This will permanently delete the organization, teams, roles and members. Type <strong>{requiredPhrase}</strong> to confirm.</Alert>
          <TextField label={`Type "${requiredPhrase}"`} fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus disabled={deleting} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting || confirmText !== requiredPhrase}>{deleting ? 'Deleting...' : 'Delete forever'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
