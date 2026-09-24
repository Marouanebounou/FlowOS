import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from '@mui/material'
import { Add, ArrowForward, Schedule, TaskAlt, Business, Group, Shield } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrganisation } from '../contexts/OrganisationContext'
import { api } from '../api/client'

export default function Dashboard() {
  const { user } = useAuth()
  const { organizations, activeOrganization, activeId } = useOrganisation()
  const firstName = user?.firstName || 'there'

  const [stats, setStats] = useState({ members: null, teams: null, roles: null, loading: false })

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      if (!activeId) { setStats({ members: null, teams: null, roles: null, loading: false }); return }
      setStats((s) => ({ ...s, loading: true }))
      const [membersRes, teamsRes, rolesRes] = await Promise.all([
        api.listOrganizationUsers(activeId),
        api.listTeams(activeId),
        api.listRolesFull(activeId),
      ])
      if (cancelled) return
      setStats({
        members: membersRes.status === 200 ? membersRes.data.length : null,
        teams: teamsRes.status === 200 ? teamsRes.data.length : null,
        roles: rolesRes.status === 200 ? rolesRes.data.length : null,
        loading: false,
      })
    }
    fetchStats()
    return () => { cancelled = true }
  }, [activeId])

  const orgCount = organizations.length
  const hasOrg = orgCount > 0
  const hasActive = !!activeOrganization

  const tasks = [
    { title: 'Review your profile', detail: user?.phoneNumber ? 'Profile complete' : 'Add your contact information', status: user?.phoneNumber ? 'Done' : 'To do', done: !!user?.phoneNumber },
    { title: 'Create an organization', detail: hasOrg ? `${orgCount} organization${orgCount > 1 ? 's' : ''} created` : 'Start working with your team', status: hasOrg ? 'Done' : 'To do', done: hasOrg },
    { title: 'Invite a teammate', detail: stats.members != null && stats.members > 1 ? `${stats.members} members` : 'Collaborate with your team', status: stats.members != null && stats.members > 1 ? 'Done' : 'Soon', done: stats.members != null && stats.members > 1 },
  ]

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Good morning, {firstName}</Typography>
          <Typography color="text.secondary">
            {hasActive ? `Active: ${activeOrganization.name}` : 'Here is what is happening in your workspace.'}
          </Typography>
        </Box>
        <Button component={Link} to="/organizations" variant="contained" startIcon={<Add />}>Create organization</Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%', borderTop: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Business color="primary" fontSize="small" /><Typography color="text.secondary" variant="body2">Organizations</Typography></Box>
              <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>{orgCount}</Typography>
              <Typography variant="body2" color="text.secondary">{hasOrg ? (hasActive ? `Active: ${activeOrganization.name}` : `${orgCount} total`) : 'No organizations yet'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%', borderTop: 4, borderColor: 'secondary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Group color="secondary" fontSize="small" /><Typography color="text.secondary" variant="body2">Team members</Typography></Box>
              {stats.loading ? <CircularProgress size={20} sx={{ mt: 1 }} /> : <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>{stats.members ?? '-'}</Typography>}
              <Typography variant="body2" color="text.secondary">{activeId ? (stats.members == null ? 'No access (admin only)' : `${stats.members} in active org`) : 'Select an organization'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%', borderTop: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Shield color="warning" fontSize="small" /><Typography color="text.secondary" variant="body2">Teams / Roles</Typography></Box>
              {stats.loading ? <CircularProgress size={20} sx={{ mt: 1 }} /> : <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>{stats.teams != null ? `${stats.teams} / ${stats.roles ?? '?'}` : '-'}</Typography>}
              <Typography variant="body2" color="text.secondary">{activeId ? (stats.teams == null ? 'No access (team.read)' : 'Teams / roles in active org') : 'Select an organization'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}><Typography variant="h6" fontWeight={600}>Getting started</Typography><TaskAlt color="primary" /></Box>
            <List disablePadding>{tasks.map((task) => <ListItem key={task.title} disableGutters sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}><TaskAlt sx={{ mr: 2, color: task.done ? 'success.main' : 'text.disabled' }} /><ListItemText primary={task.title} secondary={task.detail} /><Chip label={task.status} size="small" variant="outlined" color={task.done ? 'success' : 'default'} /></ListItem>)}</List>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}><CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Active organization</Typography>
            {hasActive ? (
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{activeOrganization.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>ID #{activeOrganization.id} {activeOrganization.primaryColor && <Chip label={activeOrganization.primaryColor} size="small" sx={{ ml: 1, bgcolor: activeOrganization.primaryColor, color: '#fff', height: 18 }} />}</Typography>
                <Button component={Link} to={`/organizations/${activeId}`} endIcon={<ArrowForward />} sx={{ mt: 1 }}>Open organization</Button>
              </Box>
            ) : (
              <Box sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>No active organization</Typography>
                <Button component={Link} to="/organizations" variant="contained" size="small">Choose organization</Button>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Recent activity</Typography>
            <List disablePadding>
              <ListItem disableGutters sx={{ py: 1 }}><Schedule sx={{ mr: 2, color: 'text.secondary' }} /><ListItemText primary="Account created" secondary="Your FlowOS account is ready" /><Typography variant="caption" color="text.secondary">Today</Typography></ListItem>
            </List>
            <Button component={Link} to="/profile" endIcon={<ArrowForward />} sx={{ mt: 1 }}>View profile</Button>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}
function Divider(props) {
  return <Box sx={{ borderBottom: 1, borderColor: 'divider', ...props.sx }} />
}
