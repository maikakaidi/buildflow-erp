import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, CircularProgress,
} from '@mui/material';
import FileUpload from './FileUpload';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'select' | 'date' | 'textarea' | 'upload';
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  gridSize?: number;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  helperText?: string;
  uploadType?: 'image' | 'file';
  multiple?: boolean;
}

interface FormDialogProps {
  open: boolean;
  title: string;
  fields: FormField[];
  values?: Record<string, any>;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
}

export default function FormDialog({ open, title, fields, values, loading, maxWidth = 'md', onClose, onSubmit }: FormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (values) {
      setFormData(values);
    } else {
      const defaults: Record<string, any> = {};
      fields.forEach((f) => { defaults[f.name] = f.defaultValue || ''; });
      setFormData(defaults);
    }
  }, [values, fields, open]);

  const update = (name: string, value: any) => setFormData((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle fontWeight={700}>{title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {fields.map((field) => (
              <Grid item xs={12} sm={field.gridSize || 6} key={field.name}>
                {field.type === 'select' ? (
                  <TextField
                    select
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => update(field.name, e.target.value)}
                    required={field.required}
                    fullWidth
                    size="small"
                    disabled={field.disabled}
                  >
                    {field.options?.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>
                ) : field.type === 'textarea' ? (
                  <TextField
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => update(field.name, e.target.value)}
                    required={field.required}
                    fullWidth
                    size="small"
                    multiline
                    rows={field.rows || 3}
                    disabled={field.disabled}
                    helperText={field.helperText}
                  />
                ) : field.type === 'upload' ? (
                  <FileUpload
                    label={field.label}
                    type={field.uploadType || 'image'}
                    multiple={field.multiple}
                    value={formData[field.name] || (field.multiple ? [] : null)}
                    onChange={(url) => update(field.name, url)}
                  />
                ) : (
                  <TextField
                    type={field.type || 'text'}
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => update(field.name, e.target.value)}
                    required={field.required}
                    fullWidth
                    size="small"
                    disabled={field.disabled}
                    helperText={field.helperText}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
