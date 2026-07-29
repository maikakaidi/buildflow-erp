import React, { useState } from 'react';
import {
  Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TableSortLabel, TextField, InputAdornment, Box, IconButton,
  Tooltip, Chip, Typography, useTheme, alpha, Skeleton, Menu, MenuItem,
  ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, DialogContentText,
} from '@mui/material';
import {
  Search as SearchIcon, FilterList as FilterIcon, MoreVert as MoreIcon,
  Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export interface Column<T> {
  id: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  onRefresh?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  actions?: { label: string; icon: React.ReactNode; onClick: (row: T) => void; color?: string }[];
  emptyMessage?: string;
  title?: string;
}

export default function DataTable<T extends { id: string; _syncStatus?: string }>({
  columns, data, loading, searchable = true, searchPlaceholder = 'Rechercher...',
  searchFields, onRefresh, onEdit, onDelete, onView, actions, emptyMessage = 'Aucune donnée',
}: DataTableProps<T>) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<T | null>(null);

  const filtered = data.filter((row) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const fields = searchFields || columns.map((c) => c.id);
    return fields.some((f) => String((row as any)[f] || '').toLowerCase().includes(searchLower));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!orderBy) return 0;
    const aVal = (a as any)[orderBy];
    const bVal = (b as any)[orderBy];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (field: string) => {
    setOrderBy(field);
    setOrder(orderBy === field && order === 'asc' ? 'desc' : 'asc');
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>, row: T) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => { setAnchorEl(null); setSelectedRow(null); };

  if (loading) {
    return (
      <Card>
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          {searchable && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ flex: 1, maxWidth: 400 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          {onRefresh && (
            <Tooltip title="Actualiser">
              <IconButton onClick={onRefresh}><RefreshIcon /></IconButton>
            </Tooltip>
          )}
        </Box>

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id} sx={{ width: col.width, textAlign: col.align }}>
                    {col.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
                {(onEdit || onDelete || onView || actions) && <TableCell align="right" sx={{ width: 80 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">{emptyMessage}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: onView ? 'pointer' : 'default' }}
                    onClick={() => onView?.(row)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.id}>
                        {col.render ? col.render(row) : (row as any)[col.id]}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onView || actions) && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenu(e, row)}>
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          labelRowsPerPage="Lignes :"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {onView && (
          <MenuItem onClick={() => { onView(selectedRow!); handleMenuClose(); }}>
            <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Voir</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => { onEdit(selectedRow!); handleMenuClose(); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Modifier</ListItemText>
          </MenuItem>
        )}
        {actions?.map((action, i) => (
          <MenuItem key={i} onClick={() => { action.onClick(selectedRow!); handleMenuClose(); }}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
        {onDelete && (
          <MenuItem onClick={() => { setDeleteConfirm(selectedRow!); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Supprimer</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={() => { onDelete?.(deleteConfirm!); setDeleteConfirm(null); }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
