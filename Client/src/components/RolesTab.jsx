import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, IconButton, Tooltip, Checkbox, FormGroup, FormControlLabel, Divider
} from '@mui/material'
import { Add, Edit, Delete, Shield, Refresh } from '@mui/icons-material'
import { api } from '../api/client'

export default function RolesTab({ organisationId, canRead, canCreate, canUpdate, canDelete, canAssign, canPermissionRead, canPermissionManage }) {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snack, setSnack] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignRole, setAssignRole] = useState(null)
  const [selectedCodes, setSelectedCodes] = useState([])
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  const [permTab, setPermTab] = useState(false) 
  const [permForm, setPermForm] = useState({ code: '', description: '' })
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [editingPerm, setEditingPerm] = useState(null)

  const fetchRoles = useCallback(async () => {
    if (!canRead) { setLoading(false); return }
    setLoading(true); setError(null)
    const res = await api.listRolesFull(organisationId)
    if (res.status === 200 && Array.isArray(res.data)) setRoles(res.data)
    else if (res.status === 403) setError('You lack permission: role.read')
    else setError(res.error?.message || `Failed to load roles (${res.status})`)
    setLoading(false)
  }, [organisationId, canRead])

  const fetchPermissions = useCallback(async () => {
    if (!canPermissionRead && !canAssign) return
    const res = await api.listPermissions(organisationId)
    if (res.status === 200 && Array.isArray(res.data)) setPermissions(res.data)
    else if (res.status !== 403) setPermissions([])
  }, [organisationId, canPermissionRead, canAssign])

  useEffect(() => { fetchRoles() }, [fetchRoles])
  useEffect(() => { fetchPermissions() }, [fetchPermissions])

  function openCreate() { setEditing(null); setForm({ name: '', description: '' }); setFormError(null); setDialogOpen(true) }
  function openEdit(role) { setEditing(role); setForm({ name: role.name, description: role.description || '' }); setFormError(null); setDialogOpen(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Role name is required'); return }
    setSubmitting(true); setFormError(null)
    const payload = { name: form.name.trim(), description: form.description.trim() || null }
    const res = editing ? await api.updateRole(organisationId, editing.id, payload) : await api.createRole(organisationId, payload)
    setSubmitting(false)
    if ((editing && res.status === 200) || (!editing && res.status === 201)) {
      setDialogOpen(false); setSnack({ severity: 'success', message: editing ? 'Role updated' : 'Role created' }); fetchRoles(); return
    }
    if (res.status === 400) { setFormError(res.error?.errors?.name || res.error?.message); return }
    setFormError(res.error?.message || 'Failed')
  }

  async function handleDelete(role) {
    if (role.name.toUpperCase() === 'ADMIN') { setSnack({ severity: 'error', message: 'ADMIN cannot be deleted' }); return }
    if (!confirm(`Delete role "${role.name}"?`)) return
    const res = await api.deleteRole(organisationId, role.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Role deleted' }); fetchRoles(); }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed: may have members' })
  }

  function openAssign(role) {
    setAssignRole(role)
    setSelectedCodes((role.permissions || []).map((p) => p.code))
    setAssignOpen(true)
  }

  async function handleAssign() {
    setAssignSubmitting(true)
    const res = await api.assignRolePermissions(organisationId, assignRole.id, selectedCodes)
    setAssignSubmitting(false)
    if (res.status === 200) {
      setAssignOpen(false); setSnack({ severity: 'success', message: 'Permissions updated (replaces all)' })
      fetchRoles()
    } else setSnack({ severity: 'error', message: res.error?.message || 'Assign failed' })
  }

  function openPermCreate() { setEditingPerm(null); setPermForm({ code: '', description: '' }); setPermDialogOpen(true) }
  function openPermEdit(p) { setEditingPerm(p); setPermForm({ code: p.code, description: p.description || '' }); setPermDialogOpen(true) }

  async function handlePermSubmit(e) {
    e.preventDefault()
    const res = editingPerm ? await api.updatePermission(organisationId, editingPerm.id, { code: permForm.code.trim().toLowerCase(), description: permForm.description.trim() || null })
      : await api.createPermission(organisationId, { code: permForm.code.trim().toLowerCase(), description: permForm.description.trim() || null })
    if ((editingPerm && res.status === 200) || (!editingPerm && res.status === 201)) {
      setPermDialogOpen(false); fetchPermissions(); setSnack({ severity: 'success', message: editingPerm ? 'Permission updated' : 'Permission created' })
    } else {
      setSnack({ severity: 'error', message: res.error?.message || 'Failed' })
    }
  }
  async function handlePermDelete(p) {
    if (!confirm(`Delete permission "${p.code}"? Must be unassigned from all roles first.`)) return
    const res = await api.deletePermission(organisationId, p.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Permission deleted' }); fetchPermissions(); fetchRoles() }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed: still assigned' })
  }

  if (!canRead) return <Alert severity="info">You lack permission: role.read</Alert>

  const grouped = permissions.reduce((acc, p) => {
    const ns = p.code.split('.')[0]
    acc[ns] = acc[ns] || []; acc[ns].push(p); return acc
  }, {})

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant={!permTab ? 'contained' : 'outlined'} size="small" onClick={() => setPermTab(false)}>Roles</Button>
        {(canPermissionRead || canPermissionManage) && <Button variant={permTab ? 'contained' : 'outlined'} size="small" onClick={() => setPermTab(true)}>Permission catalog</Button>}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh"><IconButton size="small" onClick={() => { fetchRoles(); fetchPermissions() }}><Refresh /></IconButton></Tooltip>
        {!permTab && canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create role</Button>}
        {permTab && canPermissionManage && <Button variant="contained" startIcon={<Add />} onClick={openPermCreate}>Create permission</Button>}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}

      {!permTab ? (
        loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          : roles.length === 0 ? <Alert severity="info">No roles.</Alert>
          : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Role</TableCell><TableCell>Description</TableCell><TableCell>Members</TableCell><TableCell>Permissions</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Shield fontSize="small" color={r.name === 'ADMIN' ? 'secondary' : 'disabled'} />
                        <Typography variant="body2" fontWeight={r.name === 'ADMIN' ? 700 : 500}>{r.name}</Typography>
                      </Box>
                      {r.name === 'ADMIN' && <Chip label="protected" size="small" sx={{ height: 16, fontSize: 10 }} />}
                    </TableCell>
                    <TableCell><Typography variant="caption">{r.description || '-'}</Typography></TableCell>
                    <TableCell><Chip label={r.memberCount ?? 0} size="small" /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 300 }}>
                        {(r.permissions || []).slice(0, 4).map((p) => <Chip key={p.code} label={p.code} size="small" sx={{ height: 18, fontSize: 10 }} />)}
                        {(r.permissions || []).length > 4 && <Chip label={`+${r.permissions.length - 4}`} size="small" sx={{ height: 18 }} />}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {canAssign && <Tooltip title="Assign permissions"><IconButton size="small" onClick={() => openAssign(r)}><Shield fontSize="small" /></IconButton></Tooltip>}
                        {canUpdate && <Tooltip title="Edit"><span><IconButton size="small" disabled={r.name === 'ADMIN'} onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></span></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><span><IconButton size="small" color="error" disabled={r.name === 'ADMIN'} onClick={() => handleDelete(r)}><Delete fontSize="small" /></IconButton></span></Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
      ) : (
        <Card><CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Global permission catalog (organization-scoped auth)</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Codes are global, unique, lowercase dot-separated. Must be unassigned before delete or rename.</Typography>
          {Object.entries(grouped).map(([ns, list]) => (
            <Box key={ns} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1 }}>{ns}</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Description</TableCell>{canPermissionManage && <TableCell align="right">Actions</TableCell>}</TableRow></TableHead>
                <TableBody>
                  {list.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><Typography variant="body2" fontFamily="monospace">{p.code}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{p.description || '-'}</Typography></TableCell>
                      {canPermissionManage && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openPermEdit(p)}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handlePermDelete(p)}><Delete fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
          {permissions.length === 0 && <Typography variant="body2" color="text.secondary">No permissions.</Typography>}
        </CardContent></Card>
      )}

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update role' : 'Create role'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            {editing?.name === 'ADMIN' && <Alert severity="warning">ADMIN cannot be renamed</Alert>}
            <TextField label="Name *" fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={submitting || editing?.name === 'ADMIN'} />
            <TextField label="Description" fullWidth value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={submitting} />
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => !assignSubmitting && setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign permissions - {assignRole?.name}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>Replaces entire permission set. Select complete final list.</Alert>
          <FormGroup>
            {Object.entries(grouped).map(([ns, list]) => (
              <Box key={ns} sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight={700}>{ns.toUpperCase()}</Typography>
                {list.map((p) => (
                  <FormControlLabel key={p.code} control={<Checkbox checked={selectedCodes.includes(p.code)} onChange={(e) => setSelectedCodes((prev) => e.target.checked ? [...prev, p.code] : prev.filter((c) => c !== p.code))} size="small" />} label={<Typography variant="body2" fontFamily="monospace">{p.code} - {p.description}</Typography>} />
                ))}
              </Box>
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions><Button onClick={() => setAssignOpen(false)} disabled={assignSubmitting}>Cancel</Button><Button variant="contained" onClick={handleAssign} disabled={assignSubmitting}>{assignSubmitting ? 'Saving...' : 'Save permissions'}</Button></DialogActions>
      </Dialog>

      <Dialog open={permDialogOpen} onClose={() => setPermDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPerm ? 'Update permission' : 'Create permission'}</DialogTitle>
        <Box component="form" onSubmit={handlePermSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField label="Code * (e.g. workflow.execute)" fullWidth value={permForm.code} onChange={(e) => setPermForm((f) => ({ ...f, code: e.target.value }))} helperText="lowercase dot-separated, globally unique" disabled={!!editingPerm && permissions.some((p) => p.id === editingPerm?.id && (roles.some((r) => r.permissions?.some((rp) => rp.id === p.id))))} />
            <TextField label="Description" fullWidth value={permForm.description} onChange={(e) => setPermForm((f) => ({ ...f, description: e.target.value }))} />
            {editingPerm && <Alert severity="warning">Code cannot be changed while assigned to a role.</Alert>}
          </DialogContent>
          <DialogActions><Button onClick={() => setPermDialogOpen(false)}>Cancel</Button><Button type="submit" variant="contained">{editingPerm ? 'Update' : 'Create'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
