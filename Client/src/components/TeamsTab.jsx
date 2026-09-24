import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, CircularProgress, IconButton, Tooltip, MenuItem, Select, FormControl, InputLabel, Collapse
} from '@mui/material'
import { Add, Edit, Delete, GroupAdd, PersonRemove, Star, ExpandMore, ExpandLess, Refresh } from '@mui/icons-material'
import { api } from '../api/client'

export default function TeamsTab({ organisationId, canRead, canCreate, canUpdate, canDelete, canAddMember, canRemoveMember, canAssignLeader }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState(null) // teamId
  const [membersByTeam, setMembersByTeam] = useState({}) // teamId -> members
  const [membersLoading, setMembersLoading] = useState({})
  const [orgMembers, setOrgMembers] = useState([]) // for add selector
  const [snack, setSnack] = useState(null)

  // create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null) // team or null
  const [formName, setFormName] = useState('')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // add member
  const [addMemberTeam, setAddMemberTeam] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  const fetchTeams = useCallback(async () => {
    if (!canRead) { setLoading(false); return }
    setLoading(true); setError(null)
    const res = await api.listTeams(organisationId)
    if (res.status === 200 && Array.isArray(res.data)) setTeams(res.data)
    else if (res.status === 403) setError('You lack permission: team.read')
    else setError(res.error?.message || `Failed to load teams (${res.status})`)
    setLoading(false)
  }, [organisationId, canRead])

  const fetchOrgMembers = useCallback(async () => {
    if (!canAddMember) return
    const res = await api.listOrganizationUsers(organisationId)
    if (res.status === 200) setOrgMembers(res.data)
  }, [organisationId, canAddMember])

  useEffect(() => { fetchTeams() }, [fetchTeams])
  useEffect(() => { fetchOrgMembers() }, [fetchOrgMembers])

  async function toggleMembers(teamId) {
    if (expanded === teamId) { setExpanded(null); return }
    setExpanded(teamId)
    if (membersByTeam[teamId]) return
    setMembersLoading((m) => ({ ...m, [teamId]: true }))
    const res = await api.listTeamMembers(organisationId, teamId)
    setMembersLoading((m) => ({ ...m, [teamId]: false }))
    if (res.status === 200) setMembersByTeam((prev) => ({ ...prev, [teamId]: res.data }))
    else setMembersByTeam((prev) => ({ ...prev, [teamId]: [] }))
  }

  function openCreate() {
    setEditing(null); setFormName(''); setFormError(null); setDialogOpen(true)
  }
  function openEdit(team) {
    setEditing(team); setFormName(team.name); setFormError(null); setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Team name is required'); return }
    if (formName.trim().length > 255) { setFormError('Max 255 characters'); return }
    setSubmitting(true); setFormError(null)
    const res = editing
      ? await api.updateTeam(organisationId, editing.id, { name: formName.trim() })
      : await api.createTeam(organisationId, { name: formName.trim() })
    setSubmitting(false)
    if ((editing && res.status === 200) || (!editing && res.status === 201)) {
      setDialogOpen(false)
      setSnack({ severity: 'success', message: editing ? 'Team updated' : 'Team created' })
      fetchTeams()
      return
    }
    if (res.status === 400) { setFormError(res.error?.errors?.name || res.error?.message); return }
    setFormError(res.error?.message || `Failed to ${editing ? 'update' : 'create'}`)
  }

  async function handleDelete(team) {
    if (!confirm(`Delete team "${team.name}"?`)) return
    const res = await api.deleteTeam(organisationId, team.id)
    if (res.status === 204) { setSnack({ severity: 'success', message: 'Team deleted' }); fetchTeams(); }
    else setSnack({ severity: 'error', message: res.error?.message || 'Delete failed' })
  }

  async function handleAddMember(teamId) {
    if (!selectedUserId) return
    const res = await api.addTeamMember(organisationId, teamId, Number(selectedUserId))
    if (res.status === 201) {
      setSnack({ severity: 'success', message: 'Member added' })
      setSelectedUserId('')
      // refresh members
      const mRes = await api.listTeamMembers(organisationId, teamId)
      if (mRes.status === 200) setMembersByTeam((prev) => ({ ...prev, [teamId]: mRes.data }))
      // also refresh teams to update memberCount
      fetchTeams()
    } else setSnack({ severity: 'error', message: res.error?.message || 'Failed to add' })
    setAddMemberTeam(null)
  }

  async function handleRemove(teamId, userId) {
    const res = await api.removeTeamMember(organisationId, teamId, userId)
    if (res.status === 204) {
      setSnack({ severity: 'success', message: 'Member removed' })
      setMembersByTeam((prev) => ({ ...prev, [teamId]: (prev[teamId] || []).filter((m) => m.userId !== userId) }))
      fetchTeams()
    } else setSnack({ severity: 'error', message: res.error?.message || 'Remove failed' })
  }

  async function handleAssignLeader(teamId, userId) {
    const res = await api.assignTeamLeader(organisationId, teamId, userId)
    if (res.status === 200) {
      setSnack({ severity: 'success', message: 'Leader assigned' })
      const mRes = await api.listTeamMembers(organisationId, teamId)
      if (mRes.status === 200) setMembersByTeam((prev) => ({ ...prev, [teamId]: mRes.data }))
    } else setSnack({ severity: 'error', message: res.error?.message || 'Assign failed' })
  }

  if (!canRead) return <Alert severity="info">You lack permission: team.read</Alert>

  const filtered = teams.filter((t) => !filter || t.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <Box>
      <Card sx={{ mb: 2 }}><CardContent>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search team name" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 200 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refresh"><IconButton onClick={fetchTeams} size="small"><Refresh /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create team</Button>}
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ mb: 2 }}>{snack.message}</Alert>}
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          : filtered.length === 0 ? <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}><Typography variant="body2">No teams yet. {canCreate && 'Create one to get started.'}</Typography></Box>
          : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Team</TableCell><TableCell>Members</TableCell><TableCell>Created</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {filtered.map((team) => (
                  <>
                    <TableRow key={team.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small" onClick={() => toggleMembers(team.id)}>{expanded === team.id ? <ExpandLess /> : <ExpandMore />}</IconButton>
                          <Typography variant="body2" fontWeight={600}>{team.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Chip label={team.memberCount ?? 0} size="small" /></TableCell>
                      <TableCell><Typography variant="caption">{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : '-'}</Typography></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {canUpdate && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(team)}><Edit fontSize="small" /></IconButton></Tooltip>}
                          {canDelete && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(team)}><Delete fontSize="small" /></IconButton></Tooltip>}
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${team.id}-members`}>
                      <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expanded === team.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2">Members</Typography>
                              {canAddMember && (
                                addMemberTeam === team.id ? (
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                      <InputLabel>Select member</InputLabel>
                                      <Select value={selectedUserId} label="Select member" onChange={(e) => setSelectedUserId(e.target.value)}>
                                        {orgMembers.filter((m) => !(membersByTeam[team.id] || []).some((tm) => tm.userId === m.userId)).map((m) => (
                                          <MenuItem key={m.userId} value={String(m.userId)}>{m.firstName} {m.lastName} ({m.email})</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <Button size="small" variant="contained" disabled={!selectedUserId} onClick={() => handleAddMember(team.id)}>Add</Button>
                                    <Button size="small" onClick={() => setAddMemberTeam(null)}>Cancel</Button>
                                  </Box>
                                ) : <Button size="small" startIcon={<GroupAdd />} onClick={() => setAddMemberTeam(team.id)}>Add member</Button>
                              )}
                            </Box>
                            {membersLoading[team.id] ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={20} /></Box>
                              : (membersByTeam[team.id] || []).length === 0 ? <Typography variant="body2" color="text.secondary">No members in this team.</Typography>
                              : (
                                <Table size="small" sx={{ bgcolor: 'background.paper' }}>
                                  <TableHead><TableRow><TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Leader</TableCell><TableCell>Added</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                  <TableBody>
                                    {(membersByTeam[team.id] || []).map((m) => (
                                      <TableRow key={m.userId}>
                                        <TableCell><Typography variant="body2">{m.firstName} {m.lastName}</Typography></TableCell>
                                        <TableCell><Typography variant="caption">{m.email}</Typography></TableCell>
                                        <TableCell>{m.leader ? <Chip icon={<Star sx={{ fontSize: 14 }} />} label="Leader" size="small" color="warning" sx={{ height: 20 }} /> : '-'}</TableCell>
                                        <TableCell><Typography variant="caption">{m.addedAt ? new Date(m.addedAt).toLocaleDateString() : '-'}</Typography></TableCell>
                                        <TableCell align="right">
                                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            {canAssignLeader && !m.leader && <Tooltip title="Make leader"><IconButton size="small" onClick={() => handleAssignLeader(team.id, m.userId)}><Star fontSize="small" /></IconButton></Tooltip>}
                                            {canRemoveMember && <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => handleRemove(team.id, m.userId)}><PersonRemove fontSize="small" /></IconButton></Tooltip>}
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent></Card>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update team' : 'Create team'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ pt: '16px !important' }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField label="Team name *" fullWidth autoFocus value={formName} onChange={(e) => setFormName(e.target.value)} disabled={submitting} helperText="Unique within organization, max 255" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
