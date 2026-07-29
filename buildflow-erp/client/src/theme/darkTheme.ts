import { createTheme, alpha } from '@mui/material/styles';

const darkColors = {
  background: '#0f1117',
  surface: '#1a1d29',
  surfaceHover: '#232738',
  card: '#1e2130',
  border: '#2a2e3f',
  text: '#e4e6f0',
  textSecondary: '#8b8fa3',
  primary: '#4f8cff',
  primaryHover: '#6ba0ff',
  primaryDark: '#3a6fd8',
  secondary: '#dc004e',
  success: '#00c853',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: darkColors.primary, light: darkColors.primaryHover, dark: darkColors.primaryDark },
    secondary: { main: darkColors.secondary },
    success: { main: darkColors.success },
    warning: { main: darkColors.warning },
    error: { main: darkColors.error },
    info: { main: darkColors.info },
    background: { default: darkColors.background, paper: darkColors.surface },
    text: { primary: darkColors.text, secondary: darkColors.textSecondary },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: darkColors.background,
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-track': { background: darkColors.surface },
          '&::-webkit-scrollbar-thumb': { background: darkColors.border, borderRadius: 4 },
          '&::-webkit-scrollbar-thumb:hover': { background: darkColors.textSecondary },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: darkColors.surface,
          border: `1px solid ${darkColors.border}`,
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundColor: darkColors.surface },
        rounded: { borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: '8px 24px', fontWeight: 600 },
        contained: {
          boxShadow: '0 4px 12px rgba(79,140,255,0.3)',
          '&:hover': { boxShadow: '0 6px 20px rgba(79,140,255,0.4)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: alpha(darkColors.surface, 0.6),
            '& fieldset': { borderColor: darkColors.border },
            '&:hover fieldset': { borderColor: darkColors.textSecondary },
            '&.Mui-focused fieldset': { borderColor: darkColors.primary },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: darkColors.border, padding: '12px 16px' },
        head: { fontWeight: 700, color: darkColors.textSecondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: darkColors.surface,
          borderRight: `1px solid ${darkColors.border}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: darkColors.surface,
          backgroundImage: 'none',
          borderBottom: `1px solid ${darkColors.border}`,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: darkColors.border },
      },
    },
  },
});
