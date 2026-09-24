import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress, Chip, Grid, Avatar, Tabs, Tab, List, ListItem, ListItemText,
} from '@mui/material'
import { ArrowBack, Business, Group, Settings, Shield, CalendarToday, Verified, Palette } from '@mui/icons-material'
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

  const canViewMembers = isAdmin
  const canViewTeams = isAdmin || hasPermission('team.read')
  const canViewRoles = isAdmin || hasPermission('role.read') || hasPermission('permission.read')
  const canManageSettings = isAdmin
  const canViewModules = isAdmin

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      setLoading(true); setError(null)
      const [orgRes, meRes, permRes] = await Promise.all([api.getOrganization(id), api.getMyMembership(id), api.getMyPermissions(id)])
      if (cancelled) return
      if (orgRes.status === 200 && orgRes.data) { setOrg(orgRes.data); select(orgRes.data.id) }
      else if (orgRes.status === 401) setError('Session expired')
      else if (orgRes.status === 403) setError('You are not a member of this organization or lack access')
      else if (orgRes.status === 404) setError('Organization not found')
      else setError(orgRes.error?.message || 'Failed to load organization')
      if (meRes.status === 200 && meRes.data) setMyMembership(meRes.data); else setMyMembership(null)
      if (permRes.status === 200 && Array.isArray(permRes.data)) setMyPermissions(permRes.data); else setMyPermissions([])
      setLoading(false)
    }
    fetchAll(); return () => { cancelled = true }
  }, [id, select])

  useEffect(() => {
    if (tab === 'members' && !canViewMembers) setTab('overview')
    if (tab === 'teams' && !canViewTeams) setTab('overview')
    if (tab === 'roles' && !canViewRoles) setTab('overview')
    if (tab === 'settings' && !canManageSettings) setTab('overview')
    if (tab === 'modules' && !canViewModules) setTab('overview')
  }, [tab, canViewMembers, canViewTeams, canViewRoles, canManageSettings, canViewModules])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  if (error) return <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}><Button startIcon={<ArrowBack />} onClick={() => navigate('/organizations')} sx={{ mb: 2 }}>Back to Organizations</Button><Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert></Box>

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 1 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/organizations')} sx={{ mb: 1.5, color: 'text.secondary', '&:hover': { bgcolor: 'grey.100' } }}>Back to Organizations</Button>

      <Card sx={{ mb: 2.5, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar src={org.logoUrl || undefined} sx={{ width: 48, height: 48, bgcolor: org.primaryColor || '#6366f1', fontWeight: 700, fontSize: 16 }}>
              {!org.logoUrl && org.name.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.015em', lineHeight: 1 }}>{org.name}</Typography>
                {isAdmin && <Chip icon={<Verified sx={{ fontSize: 14 }} />} label="Admin" size="small" color="secondary" sx={{ height: 20, fontWeight: 700, fontSize: 11 }} />}
                {myMembership && !isAdmin && <Chip label={myMembership.roleName} size="small" variant="outlined" sx={{ height: 20, fontWeight: 600, fontSize: 11 }} />}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: 13 }}>
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}><CalendarToday sx={{ fontSize: 14 }} /> {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}</Box>
                <Box sx={{ width: 3, height: 3, borderRadius: 99, bgcolor: 'text.disabled' }} /> ID #{org.id}
                {org.primaryColor && <><Box sx={{ width: 3, height: 3, borderRadius: 99, bgcolor: 'text.disabled' }} /><Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}><Palette sx={{ fontSize: 12 }} /> {org.primaryColor}</Box></>}
              </Typography>
            </Box>
            <Chip label={org.primaryColor || 'Default theme'} size="small" sx={{ bgcolor: org.primaryColor || '#f1f5f9', color: org.primaryColor ? 'white' : 'text.secondary', fontWeight: 600, border: org.primaryColor ? 'none' : '1px solid #e2e8f0', height: 22 }} />
          </Box>
          {org.logoUrl && <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}><Typography variant="caption" color="text.secondary" fontWeight={600}>Logo URL</Typography><Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>{org.logoUrl}</Typography></Box>}
        </CardContent>
      </Card>

      <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, p: 0.5, mb: 2.5, display: 'inline-flex', gap: 0.5, overflowX: 'auto', maxWidth: '100%' }}>
        {[
          { v: 'overview', label: 'Overview', icon: Business },
          ...(canViewMembers ? [{ v: 'members', label: 'Members', icon: Group }] : []),
          ...(canViewTeams ? [{ v: 'teams', label: 'Teams', icon: Group }] : []),
          ...(canViewRoles ? [{ v: 'roles', label: 'Roles', icon: Shield }] : []),
          ...(canViewModules ? [{ v: 'modules', label: 'Modules', icon: Settings }] : []),
          ...(canManageSettings ? [{ v: 'settings', label: 'Settings', icon: Settings }] : []),
        ].map((t) => {
          const active = tab === t.v
          return (
            <Button key={t.v} onClick={() => setTab(t.v)} startIcon={<t.icon sx={{ fontSize: 16 }} />} size="small" sx={{ borderRadius: 1.5, px: 1.8, py: 0.8, bgcolor: active ? 'grey.900' : 'transparent', color: active ? 'white' : 'text.secondary', '&:hover': { bgcolor: active ? 'grey.900' : 'grey.100' }, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', minWidth: 'auto' }}>
              {t.label}
            </Button>
          )
        })}
      </Box>

      {tab === 'overview' && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card><CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.015em', mb: 0.5 }}>Overview</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>Your workspace for <strong>{org.name}</strong>. Manage members, teams, roles and installed modules. All actions are permission-gated and hidden if you lack access.</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {canViewMembers && <Button variant="contained" size="small" onClick={() => setTab('members')} sx={{ borderRadius: 2 }}>Manage members</Button>}
                {canViewTeams && <Button variant="outlined" size="small" onClick={() => setTab('teams')} sx={{ borderRadius: 2, bgcolor: 'white' }}>Manage teams</Button>}
                {canViewRoles && <Button variant="outlined" size="small" onClick={() => setTab('roles')} sx={{ borderRadius: 2, bgcolor: 'white' }}>Manage roles</Button>}
                {canViewModules && <Button variant="outlined" size="small" onClick={() => setTab('modules')} sx={{ borderRadius: 2, bgcolor: 'white' }}>Modules</Button>}
                {!canViewMembers && !canViewTeams && !canViewRoles && <Typography variant="body2" color="text.secondary">Limited access in this organization.</Typography>}
              </Box>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ overflow: 'hidden' }}>
              <Box sx={{ height: 3, background: org.primaryColor || '#6366f1' }} />
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, letterSpacing: '-0.01em' }}>Details</Typography>
                <List dense disablePadding>
                  <ListItem disableGutters sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}><ListItemText primary={<Typography variant="caption" color="text.secondary" fontWeight={600}>Organization ID</Typography>} secondary={<Typography variant="body2" fontWeight={600}>#{org.id}</Typography>} /></ListItem>
                  <ListItem disableGutters sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}><ListItemText primary={<Typography variant="caption" color="text.secondary" fontWeight={600}>Your role</Typography>} secondary={<Chip label={myMembership?.roleName || '—'} size="small" color={isAdmin ? 'secondary' : 'default'} sx={{ height: 20, fontWeight: 600 }} />} /></ListItem>
                  <ListItem disableGutters sx={{ py: 1 }}><ListItemText primary={<Typography variant="caption" color="text.secondary" fontWeight={600}>Theme</Typography>} secondary={org.primaryColor || 'Default'} /></ListItem>
                </List>
                <Button component={Link} to="/organizations" size="small" sx={{ mt: 1.5 }} variant="outlined">View all organizations</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'members' && canViewMembers && <MembersTab organisationId={id} isAdmin={isAdmin} />}
      {tab === 'teams' && canViewTeams && <TeamsTab organisationId={id} canRead={canViewTeams} canCreate={hasPermission('team.create') || isAdmin} canUpdate={hasPermission('team.update') || isAdmin} canDelete={hasPermission('team.delete') || isAdmin} canAddMember={hasPermission('team.member.add') || isAdmin} canRemoveMember={hasPermission('team.member.remove') || isAdmin} canAssignLeader={hasPermission('team.leader.assign') || isAdmin} />}
      {tab === 'roles' && canViewRoles && <RolesTab organisationId={id} canRead={canViewRoles} canCreate={hasPermission('role.create') || isAdmin} canUpdate={hasPermission('role.update') || isAdmin} canDelete={hasPermission('role.delete') || isAdmin} canAssign={hasPermission('role.permission.assign') || isAdmin} canPermissionRead={hasPermission('permission.read') || isAdmin} canPermissionManage={hasPermission('permission.create') || hasPermission('permission.update') || hasPermission('permission.delete') || isAdmin} />}
      {tab === 'modules' && canViewModules && <ModulesTab organisationId={id} isAdmin={isAdmin} />}
      {tab === 'settings' && canManageSettings && <SettingsTab organisation={org} onUpdated={(u) => setOrg(u)} onDeleted={() => { refresh?.(); navigate('/organizations') }} />}
    </Box>
  )
}
