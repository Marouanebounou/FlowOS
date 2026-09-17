import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#aa3bff',
    },
    secondary: {
      main: '#16a34a',
    },
    error: {
      main: '#dc2626',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
})

export default theme
