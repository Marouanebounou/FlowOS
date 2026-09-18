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
} from '@mui/material'
import { Add, ArrowForward, Schedule, TaskAlt } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const tasks = [
  { title: 'Review your profile', detail: 'Add your contact information', status: 'To do' },
  { title: 'Create an organization', detail: 'Start working with your team', status: 'To do' },
  { title: 'Invite a teammate', detail: 'Collaborate with your team', status: 'Soon' },
]

const activity = [
  { title: 'Account created', detail: 'Your FlowOS account is ready', time: 'Today' },
  { title: 'Welcome to FlowOS', detail: 'Explore your personal workspace', time: 'Today' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.firstName || 'there'

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Good morning, {firstName}</Typography>
          <Typography color="text.secondary">Here is what is happening in your workspace.</Typography>
        </Box>
        <Button component={Link} to="/organizations" variant="contained" startIcon={<Add />}>Create organization</Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}><Card sx={{ height: '100%', borderTop: 4, borderColor: 'primary.main' }}><CardContent><Typography color="text.secondary" variant="body2">Organizations</Typography><Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>0</Typography><Typography variant="body2" color="text.secondary">No organizations yet</Typography></CardContent></Card></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><Card sx={{ height: '100%', borderTop: 4, borderColor: 'secondary.main' }}><CardContent><Typography color="text.secondary" variant="body2">Tasks completed</Typography><Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>0</Typography><Typography variant="body2" color="text.secondary">Keep building your workspace</Typography></CardContent></Card></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><Card sx={{ height: '100%', borderTop: 4, borderColor: 'warning.main' }}><CardContent><Typography color="text.secondary" variant="body2">Pending tasks</Typography><Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>3</Typography><Typography variant="body2" color="text.secondary">A few things to get started</Typography></CardContent></Card></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}><Typography variant="h6" fontWeight={600}>Getting started</Typography><TaskAlt color="primary" /></Box>
            <List disablePadding>{tasks.map((task) => <ListItem key={task.title} disableGutters sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}><TaskAlt sx={{ mr: 2, color: 'text.disabled' }} /><ListItemText primary={task.title} secondary={task.detail} /><Chip label={task.status} size="small" variant="outlined" /></ListItem>)}</List>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}><CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Recent activity</Typography>
            <List disablePadding>{activity.map((item) => <ListItem key={item.title} disableGutters sx={{ py: 1.5 }}><Schedule sx={{ mr: 2, color: 'text.secondary' }} /><ListItemText primary={item.title} secondary={item.detail} /><Typography variant="caption" color="text.secondary">{item.time}</Typography></ListItem>)}</List>
            <Button component={Link} to="/profile" endIcon={<ArrowForward />} sx={{ mt: 1 }}>View profile</Button>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}