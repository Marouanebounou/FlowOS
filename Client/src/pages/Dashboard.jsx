import { useEffect, useState } from 'react'
import {
  Box, Button, Card, CardContent, Chip, Grid, List, ListItem, ListItemText, Typography, LinearProgress, Avatar,
} from '@mui/material'
import { Add, ArrowForward, Schedule, TaskAlt, Business, Group, Shield, TrendingUp, CheckCircle } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrganisation } from '../contexts/OrganisationContext'
import { api } from '../api/client'

export default function Dashboard() {
  const { user } = useAuth()
  const { organizations, activeOrganization, activeId } = useOrganisation()
  const firstName = user?.firstName || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

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
  const completion = [!!user?.phoneNumber, hasOrg, stats.members != null && stats.members > 1].filter(Boolean).length
  const progress = Math.round((completion / 3) * 100)

  const tasks = [
    { title: 'Review your profile', detail: user?.phoneNumber ? 'Profile complete' : 'Add contact information', status: user?.phoneNumber ? 'Done' : 'To do', done: !!user?.phoneNumber },
    { title: 'Create an organization', detail: hasOrg ? `${orgCount} created` : 'Start with your team', status: hasOrg ? 'Done' : 'To do', done: hasOrg },
    { title: 'Invite a teammate', detail: stats.members > 1 ? `${stats.members} members` : 'Collaborate', status: stats.members > 1 ? 'Done' : 'Soon', done: stats.members > 1 },
  ]

  const StatCard = ({ icon: Icon, label, value, sub, color, gradient }) => (
    <Card sx={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color }} />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Icon sx={{ fontSize: 18 }} />
          </Box>
          <Chip label={stats.loading ? '...' : value ?? '-'} size="small" sx={{ fontWeight: 700, bgcolor: 'grey.100', border: '1px solid #e2e8f0' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</Typography>
        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: '-0.02em' }}>{stats.loading ? '—' : value ?? '-'}</Typography>
        <Typography variant="caption" color="text.secondary">{sub}</Typography>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', py: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {greeting}, <Box component="span" sx={{ color: 'primary.main' }}>{firstName}</Box>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography color="text.secondary" variant="body2">
              {hasActive ? activeOrganization.name : 'Your workspace overview'}
            </Typography>
            {hasActive && <Chip label={`#${activeId}`} size="small" sx={{ height: 18, fontSize: 11, bgcolor: 'grey.100' }} />}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button component={Link} to="/organizations" variant="outlined" sx={{ bgcolor: 'white' }}>Browse orgs</Button>
          <Button component={Link} to="/organizations" variant="contained" startIcon={<Add />} sx={{ px: 2.5, boxShadow: '0 4px 12px -2px rgb(99 102 241 / 0.3)' }}>Create organization</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard icon={Business} label="Organizations" value={orgCount} sub={hasOrg ? (hasActive ? `Active: ${activeOrganization.name}` : `${orgCount} total`) : 'No orgs yet'} color="primary.main" gradient="linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard icon={Group} label="Team members" value={stats.members} sub={activeId ? (stats.members == null ? 'Admin only' : `${stats.members} in active org`) : 'Select org'} color="#06b6d4" gradient="linear-gradient(135deg,#06b6d4 0%,#22d3ee 100%)" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard icon={Shield} label="Teams • Roles" value={stats.teams != null ? `${stats.teams} • ${stats.roles ?? '?'}` : null} sub={activeId ? (stats.teams == null ? 'Requires team.read' : 'Active org') : 'Select org'} color="#10b981" gradient="linear-gradient(135deg,#10b981 0%,#34d399 100%)" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Getting started</Typography>
                  <Typography variant="caption" color="text.secondary">{completion}/3 completed</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" fontWeight={700} color="primary.main">{progress}%</Typography>
                  <Box sx={{ width: 64 }}><LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 99, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { borderRadius: 99 } }} /></Box>
                </Box>
              </Box>
              <List disablePadding>
                {tasks.map((t, i) => (
                  <ListItem key={t.title} disableGutters sx={{ px: 2.5, py: 1.8, borderTop: i === 0 ? '1px solid #f1f5f9' : 'none', borderBottom: '1px solid #f1f5f9', bgcolor: t.done ? 'grey.50' : 'transparent' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: t.done ? 'success.main' : 'grey.100', color: t.done ? 'white' : 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.8, border: t.done ? 'none' : '1px solid #e2e8f0' }}>
                      {t.done ? <CheckCircle sx={{ fontSize: 16 }} /> : <TaskAlt sx={{ fontSize: 16 }} />}
                    </Box>
                    <ListItemText primary={<Typography variant="body2" fontWeight={t.done ? 600 : 500} sx={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.7 : 1 }}>{t.title}</Typography>} secondary={t.detail} />
                    <Chip label={t.status} size="small" color={t.done ? 'success' : 'default'} variant={t.done ? 'filled' : 'outlined'} sx={{ height: 22, fontWeight: 600, fontSize: 11 }} />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} component={Link} to="/profile">Go to profile</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ height: 3, background: 'linear-gradient(90deg,#6366f1 0%,#06b6d4 100%)' }} />
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                <Avatar sx={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)', fontWeight: 700 }}>
                  {(activeOrganization?.name?.[0] || user?.firstName?.[0] || 'F').toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>{hasActive ? activeOrganization.name : 'No active organization'}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{hasActive ? `ID #${activeId} • ${activeOrganization.primaryColor || 'default theme'}` : 'Choose or create one'}</Typography>
                </Box>
                {hasActive && activeOrganization.primaryColor && <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: activeOrganization.primaryColor, border: '1px solid #e2e8f0' }} />}
              </Box>

              {hasActive ? (
                <>
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
                    <Chip size="small" label={`${stats.members ?? '-'} members`} sx={{ bgcolor: 'grey.100' }} />
                    <Chip size="small" label={`${stats.teams ?? '-'} teams`} sx={{ bgcolor: 'grey.100' }} />
                    <Chip size="small" icon={<TrendingUp sx={{ fontSize: 12 }} />} label="Active" color="success" variant="outlined" sx={{ height: 22 }} />
                  </Box>
                  <Button fullWidth component={Link} to={`/organizations/${activeId}`} variant="contained" endIcon={<ArrowForward />} sx={{ mb: 1 }}>Open organization</Button>
                  <Button fullWidth component={Link} to="/organizations" variant="outlined" sx={{ bgcolor: 'white' }}>Switch organization</Button>
                </>
              ) : (
                <Box sx={{ py: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed #e2e8f0', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No active workspace</Typography>
                  <Button component={Link} to="/organizations" variant="contained" size="small">Choose organization</Button>
                </Box>
              )}

              <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                <Typography variant="caption" fontWeight={700} letterSpacing="0.06em" color="text.secondary">RECENT ACTIVITY</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}><Schedule sx={{ fontSize: 14, color: 'text.secondary' }} /></Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: 13 }}>Account created</Typography>
                    <Typography variant="caption" color="text.secondary">Your FlowOS account is ready • Today</Typography>
                  </Box>
                  <Box sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: 'success.main', mt: 0.7 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
