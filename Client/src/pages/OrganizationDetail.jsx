import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { ArrowBack, Business, Group, Settings, Shield, CalendarToday } from '@mui/icons-material'
import { api } from '../api/client'
import { useOrganisation } from '../contexts/OrganisationContext'
import MembersTab from '../components/MembersTab'
import TeamsTab from '../components/TeamsTab'
import RolesTab from '../components/RolesTab'
import SettingsTab from '../components/SettingsTab'
import ModulesTab from '../components/ModulesTab'

export default function OrganizationDetail() {
  const { organisationId } = useParams()
  const id = Number(organisationId)
  const navigate = useNavigate()
  const { select, refresh } = useOrganisation()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('overview')
  const [myMembership, setMyMembership] = useState(null)
  const [myPermissions, setMyPermissions] = useState([])

  const isAdmin = useMemo(() => (myMembership?.roleName || '').toUpperCase() === 'ADMIN', [myMembership])
  const hasPermission = (code) => myPermissions.includes(code)

  // permission-gated visibility: hide tabs user can't use
  const canViewMembers = isAdmin
  const canViewTeams = isAdmin || hasPermission('team.read')
  const canViewRoles = isAdmin || hasPermission('role.read') || hasPermission('permission.read')
  const canManageSettings = isAdmin
  const canViewModules = isAdmin // only admin can manage modules (install needs ADMIN)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      setLoading(true)
      setError(null)
      const [orgRes, meRes, permRes] = await Promise.all([
        api.getOrganization(id),
        api.getMyMembership(id),
        api.getMyPermissions(id),
      ])
      if (cancelled) return
      if (orgRes.status === 200 && orgRes.data) {
        setOrg(orgRes.data)
        select(orgRes.data.id)
      } else if (orgRes.status === 401) {
        setError('Session expired')
      } else if (orgRes.status === 403) {
        setError('You are not a member of this organization or lack access')
      } else if (orgRes.status === 404) {
        setError('Organization not found')
      } else {
        setError(orgRes.error?.message || 'Failed to load organization')
      }

      if (meRes.status === 200 && meRes.data) {
        setMyMembership(meRes.data)
      } else {
        setMyMembership(null)
      }
      if (permRes.status === 200 && Array.isArray(permRes.data)) {
        setMyPermissions(permRes.data)
      } else {
        setMyPermissions([])
      }
      setLoading(false)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [id, select])

  // if current tab becomes hidden, fall back to overview
  useEffect(() => {
    if (tab === 'members' && !canViewMembers) setTab('overview')
    if (tab === 'teams' && !canViewTeams) setTab('overview')
    if (tab === 'roles' && !canViewRoles) setTab('overview')
    if (tab === 'settings' && !canManageSettings) setTab('overview')
    if (tab === 'modules' && !canViewModules) setTab('overview')
  }, [tab, canViewMembers, canViewTeams, canViewRoles, canManageSettings, canViewModules])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/organizations')} sx={{ mb: 2 }}>Back to Organizations</Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/organizations')} sx={{ mb: 2 }}>Back to Organizations</Button>

      <Card sx={{ mb: 3, borderTop: 4, borderColor: org.primaryColor || 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar src={org.logoUrl || undefined} sx={{ width: 56, height: 56, bgcolor: org.primaryColor || 'primary.main' }}>
              {!org.logoUrl && <Business />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="h5" fontWeight={700}>{org.name}</Typography>
              <Typography variant="body2" color="text.secondary">ID #{org.id} • Created {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : ''}</Typography>
              {myMembership && (
                <Chip label={`${myMembership.roleName}`} size="small" color={isAdmin ? 'secondary' : 'default'} sx={{ mt: 0.5, height: 20 }} />
              )}
            </Box>
            <Chip icon={<CalendarToday sx={{ fontSize: 16 }} />} label={org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'} variant="outlined" />
            {org.primaryColor && <Chip label={org.primaryColor} sx={{ bgcolor: org.primaryColor, color: '#fff' }} size="small" />}
          </Box>

          {org.logoUrl && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Logo URL</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{org.logoUrl}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab value="overview" label="Overview" icon={<Business fontSize="small" />} iconPosition="start" />
        {canViewMembers && <Tab value="members" label="Members" icon={<Group fontSize="small" />} iconPosition="start" />}
        {canViewTeams && <Tab value="teams" label="Teams" icon={<Group fontSize="small" />} iconPosition="start" />}
        {canViewRoles && <Tab value="roles" label="Roles & Permissions" icon={<Shield fontSize="small" />} iconPosition="start" />}
        {canViewModules && <Tab value="modules" label="Modules" icon={<Settings fontSize="small" />} iconPosition="start" />}
        {canManageSettings && <Tab value="settings" label="Settings" icon={<Settings fontSize="small" />} iconPosition="start" />}
      </Tabs>

      {tab === 'overview' && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card><CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Overview</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is your organization workspace. Manage members, create teams, and configure roles & permissions.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick actions</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {canViewMembers && <Button variant="contained" size="small" onClick={() => setTab('members')}>Manage members</Button>}
                {canViewTeams && <Button variant="outlined" size="small" onClick={() => setTab('teams')}>Manage teams</Button>}
                {canViewRoles && <Button variant="outlined" size="small" onClick={() => setTab('roles')}>Manage roles</Button>}
                {!canViewMembers && !canViewTeams && !canViewRoles && (
                  <Typography variant="body2" color="text.secondary">You have limited access in this organization.</Typography>
                )}
              </Box>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card><CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Details</Typography>
              <List dense disablePadding>
                <ListItem disableGutters sx={{ py: 0.5 }}><ListItemText primary="Organization ID" secondary={org.id} /></ListItem>
                <ListItem disableGutters sx={{ py: 0.5 }}><ListItemText primary="Your role" secondary={myMembership?.roleName || '—'} /></ListItem>
                <ListItem disableGutters sx={{ py: 0.5 }}><ListItemText primary="Primary color" secondary={org.primaryColor || 'Not set'} /></ListItem>
                <ListItem disableGutters sx={{ py: 0.5 }}><ListItemText primary="Logo" secondary={org.logoUrl ? 'Configured' : 'Not set'} /></ListItem>
              </List>
              <Button component={Link} to="/organizations" size="small" sx={{ mt: 1 }}>View all organizations</Button>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {tab === 'members' && canViewMembers && <MembersTab organisationId={id} isAdmin={isAdmin} />}
      {tab === 'teams' && canViewTeams && (
        <TeamsTab
          organisationId={id}
          canRead={canViewTeams}
          canCreate={hasPermission('team.create') || isAdmin}
          canUpdate={hasPermission('team.update') || isAdmin}
          canDelete={hasPermission('team.delete') || isAdmin}
          canAddMember={hasPermission('team.member.add') || isAdmin}
          canRemoveMember={hasPermission('team.member.remove') || isAdmin}
          canAssignLeader={hasPermission('team.leader.assign') || isAdmin}
        />
      )}
      {tab === 'roles' && canViewRoles && (
        <RolesTab
          organisationId={id}
          canRead={canViewRoles}
          canCreate={hasPermission('role.create') || isAdmin}
          canUpdate={hasPermission('role.update') || isAdmin}
          canDelete={hasPermission('role.delete') || isAdmin}
          canAssign={hasPermission('role.permission.assign') || isAdmin}
          canPermissionRead={hasPermission('permission.read') || isAdmin}
          canPermissionManage={hasPermission('permission.create') || hasPermission('permission.update') || hasPermission('permission.delete') || isAdmin}
        />
      )}
      {tab === 'modules' && canViewModules && <ModulesTab organisationId={id} isAdmin={isAdmin} />}
      {tab === 'settings' && canManageSettings && (
        <SettingsTab
          organisation={org}
          onUpdated={(updated) => setOrg(updated)}
          onDeleted={() => { refresh?.(); navigate('/organizations') }}
        />
      )}
    </Box>
  )
}
