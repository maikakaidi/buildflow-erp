import React, { useMemo } from 'react';
import { ThemeProvider, createTheme, alpha, CssBaseline } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const baseTheme = createTheme({
  palette: { mode: 'dark' as const },
});

export default function DynamicThemeWrapper({ children }: { children: React.ReactNode }) {
  const { company } = useAuth();

  const theme = useMemo(() => {
    const primary = company?.primaryColor || '#4f8cff';
    const secondary = company?.secondaryColor || '#dc004e';
    const bg = '#0f1117';
    const surface = '#1a1d29';
    const border = '#2a2e3f';
    const text = '#e4e6f0';
    const textSecondary = '#8b8fa3';

    return createTheme({
      palette: {
        mode: 'dark',
        primary: { main: primary, light: alpha(primary, 0.8), dark: alpha(primary, 0.7) },
        secondary: { main: secondary },
        success: { main: '#00c853' },
        warning: { main: '#ff9800' },
        error: { main: '#f44336' },
        info: { main: '#2196f3' },
        background: { default: bg, paper: surface },
        text: { primary: text, secondary: textSecondary },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 }, h2: { fontWeight: 700 }, h3: { fontWeight: 600 },
        h4: { fontWeight: 600 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        button: { fontWeight: 600, textTransform: 'none' },
      },
      shape: { borderRadius: 12 },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: bg,
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-track': { background: surface },
              '&::-webkit-scrollbar-thumb': { background: border, borderRadius: 4 },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: surface,
              border: `1px solid ${border}`,
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
            },
          },
        },
        MuiPaper: {
          styleOverrides: { root: { backgroundColor: surface }, rounded: { borderRadius: 16 } },
        },
        MuiButton: {
          styleOverrides: {
            root: { borderRadius: 10, padding: '8px 24px', fontWeight: 600 },
            contained: {
              boxShadow: `0 4px 12px ${alpha(primary, 0.3)}`,
              '&:hover': { boxShadow: `0 6px 20px ${alpha(primary, 0.4)}` },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 10,
                backgroundColor: alpha(surface, 0.6),
                '& fieldset': { borderColor: border },
                '&:hover fieldset': { borderColor: textSecondary },
                '&.Mui-focused fieldset': { borderColor: primary },
              },
            },
          },
        },
        MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
        MuiTableCell: {
          styleOverrides: {
            root: { borderColor: border, padding: '12px 16px' },
            head: { fontWeight: 700, color: textSecondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 },
          },
        },
        MuiDrawer: { styleOverrides: { paper: { backgroundColor: surface, borderRight: `1px solid ${border}` } } },
        MuiAppBar: { styleOverrides: { root: { backgroundColor: surface, backgroundImage: 'none', borderBottom: `1px solid ${border}` } } },
        MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, backgroundColor: border } } },
        MuiIconButton: { styleOverrides: { root: { '&:hover': { backgroundColor: alpha(primary, 0.08) } } } },
      },
    });
  }, [company?.primaryColor, company?.secondaryColor]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
