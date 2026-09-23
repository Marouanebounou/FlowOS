import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { GroupAdd, Search, Block, CheckCircle, Refresh, Edit as EditIcon } from '@mui/icons-material'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function MembersTab({ organisationId, isAdmin = true }) {
  const { user: currentUser } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ name: '', email: '', active: '' })
  const [roles, setRoles] = useState([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', roleId: '' })
  const [inviteError, setInviteError] = useState(null)
  const [inviteFieldErrors, setInviteFieldErrors] = useState({})
  const [inviting, setInviting] = useState(false)
  const [snack, setSnack] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // userId
  const [editOpen, setEditOpen] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phoneNumber: '' })
  const [editErrors, setEditErrors] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await api.listOrganizationUsers(organisationId, {
      name: filters.name.trim() || undefined,
      email: filters.email.trim() || undefined,
      active: filters.active === '' ? undefined : filters.active === 'true',
    })
    if (result.status === 200 && Array.isArray(result.data)) {
      setMembers(result.data)
    } else if (result.status === 403) {
      setError('You lack permission to view members (requires organization admin)')
    } else {
      setError(result.error?.message || `Failed to load members (${result.status})`)
    }
    setLoading(false)
  }, [organisationId, filters])

  const fetchRoles = useCallback(async () => {
    const result = await api.listRoles(organisationId)
    if (result.status === 200 && Array.isArray(result.data)) {
      setRoles(result.data)
    } else {
      setRoles([])
    }
  }, [organisationId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  function handleInviteOpen() {
    setInviteForm({ email: '', roleId: '' })
    setInviteError(null)
    setInviteFieldErrors({})
    setInviteOpen(true)
  }

  function validateInvite() {
    const e = {}
    if (!inviteForm.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(inviteForm.email)) e.email = 'Email must be valid'
    if (inviteForm.roleId && isNaN(Number(inviteForm.roleId))) e.roleId = 'Invalid role'
    return e
  }

  async function handleInviteSubmit(ev) {
    ev.preventDefault()
    setInviteError(null)
    const errs = validateInvite()
    setInviteFieldErrors(errs)
    if (Object.keys(errs).length) return
    setInviting(true)
    try {
      const payload = {
        email: inviteForm.email.trim().toLowerCase(),
        roleId: inviteForm.roleId ? Number(inviteForm.roleId) : null,
      }
      // remove null roleId to use default MEMBER
      if (!payload.roleId) delete payload.roleId
      const result = await api.inviteUser(organisationId, payload)
      if (result.status === 202 || result.status === 204) {
        setInviteOpen(false)
        setSnack({ severity: 'success', message: `Invitation sent to ${payload.email}` })
        return
      }
      if (result.status === 400 || result.status === 409) {
        setInviteFieldErrors(result.error?.errors || {})
        setInviteError(result.error?.message || 'Validation failed')
        return
      }
      setInviteError(result.error?.message || `Failed to invite (${result.status})`)
    } catch (e) {
      setInviteError(e?.message || 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  function openEdit(member) {
    setEditMember(member)
    setEditForm({ firstName: member.firstName || '', lastName: member.lastName || '', phoneNumber: member.phoneNumber || '' })
    setEditErrors({}); setEditOpen(true)
  }

  function validateEdit() {
    const e = {}
    if (!editForm.firstName.trim()) e.firstName = 'First name is required'
    if (!editForm.lastName.trim()) e.lastName = 'Last name is required'
    if (editForm.phoneNumber && !/^[\d+()\-\\s]+$/.test(editForm.phoneNumber)) e.phoneNumber = 'Phone number is invalid'
    return e
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    const errs = validateEdit(); setEditErrors(errs)
    if (Object.keys(errs).length) return
    setEditSaving(true)
    const result = await api.updateOrganizationMember(organisationId, editMember.userId, {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      phoneNumber: editForm.phoneNumber.trim() || null,
    })
    setEditSaving(false)
    if (result.status === 200) {
      setEditOpen(false)
      // refresh list to get updated names; API returns UserProfileResponse not OrganisationUserResponse, so refetch
      fetchMembers()
      setSnack({ severity: 'success', message: 'Member profile updated' })
    } else {
      if (result.error?.errors) setEditErrors(result.error.errors)
      setSnack({ severity: 'error', message: result.error?.message || 'Failed to update' })
    }
  }

  async function handleToggleActive(member) {
    const isActive = member.membershipActive
    const isSelf = currentUser?.email && member.email && currentUser.email.toLowerCase() === member.email.toLowerCase()
    if (isSelf && isActive) {
      setSnack({ severity: 'error', message: 'You cannot deactivate your own account' })
      return
    }
    setActionLoading(member.userId)
    const result = isActive
      ? await api.deactivateUser(organisationId, member.userId)
      : await api.reactivateUser(organisationId, member.userId)
    setActionLoading(null)
    if (result.status === 200 && result.data) {
      setMembers((prev) => prev.map((m) => m.userId === member.userId ? result.data : m))
      setSnack({ severity: 'success', message: isActive ? 'User deactivated (global account disabled)' : 'User reactivated' })
    } else {
      setSnack({ severity: 'error', message: result.error?.message || `Failed to ${isActive ? 'deactivate' : 'reactivate'}` })
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search name"
              value={filters.name}
              onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              size="small"
              placeholder="Search email"
              value={filters.email}
              onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
              sx={{ minWidth: 180 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filters.active} label="Status" onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Refresh"><IconButton onClick={fetchMembers} size="small"><Refresh /></IconButton></Tooltip>
            {isAdmin && <Button variant="contained" startIcon={<GroupAdd />} onClick={handleInviteOpen}>Invite member</Button>}
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : members.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <Typography variant="body2">No members found.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((m) => {
                    const isSelf = currentUser?.email?.toLowerCase() === m.email?.toLowerCase()
                    return (
                      <TableRow key={m.userId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{m.firstName} {m.lastName}</Typography>
                          {isSelf && <Chip label="You" size="small" color="primary" sx={{ height: 18, ml: 0.5 }} />}
                        </TableCell>
                        <TableCell><Typography variant="body2">{m.email}</Typography></TableCell>
                        <TableCell><Chip label={m.roleName} size="small" variant="outlined" /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                            <Chip label={m.membershipActive ? 'Active' : 'Inactive'} color={m.membershipActive ? 'success' : 'default'} size="small" sx={{ height: 20, width: 'fit-content' }} />
                            {!m.userActive && <Typography variant="caption" color="error">Account disabled</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="caption">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '-'}</Typography></TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                            {isAdmin && (
                              <Tooltip title="Edit profile"><IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            )}
                            <Button
                              size="small"
                              color={m.membershipActive ? 'error' : 'success'}
                              startIcon={m.membershipActive ? <Block /> : <CheckCircle />}
                              disabled={!!actionLoading || (isSelf && m.membershipActive)}
                              onClick={() => handleToggleActive(m)}
                            >
                              {actionLoading === m.userId ? '...' : m.membershipActive ? 'Deactivate' : 'Reactivate'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            Deactivation disables the global account (user cannot log in to any organization). Self-deactivation is blocked.
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onClose={() => !inviting && setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite member</DialogTitle>
        <Box component="form" onSubmit={handleInviteSubmit} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
            {inviteError && <Alert severity="error">{inviteError}</Alert>}
            <TextField
              label="Email *"
              type="email"
              fullWidth
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              error={!!inviteFieldErrors.email}
              helperText={inviteFieldErrors.email || 'Invitation valid 48h, role defaults to MEMBER'}
              disabled={inviting}
            />
            <FormControl fullWidth error={!!inviteFieldErrors.roleId}>
              <InputLabel>Role (optional)</InputLabel>
              <Select
                value={inviteForm.roleId}
                label="Role (optional)"
                onChange={(e) => setInviteForm((f) => ({ ...f, roleId: e.target.value }))}
                disabled={inviting}
              >
                <MenuItem value="">Default (MEMBER)</MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>{r.name} - {r.description}</MenuItem>
                ))}
              </Select>
              {inviteFieldErrors.roleId && <Typography variant="caption" color="error">{inviteFieldErrors.roleId}</Typography>}
            </FormControl>
            {roles.length === 0 && <Alert severity="info">Roles not loaded - invite will use MEMBER. Requires `role.read`.</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setInviteOpen(false)} disabled={inviting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={inviting}>{inviting ? 'Sending...' : 'Send invitation'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit member - {editMember?.email}</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField label="First name *" fullWidth value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} error={!!editErrors.firstName} helperText={editErrors.firstName} disabled={editSaving} />
            <TextField label="Last name *" fullWidth value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} error={!!editErrors.lastName} helperText={editErrors.lastName} disabled={editSaving} />
            <TextField label="Phone" fullWidth value={editForm.phoneNumber} onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))} error={!!editErrors.phoneNumber} helperText={editErrors.phoneNumber} disabled={editSaving} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
