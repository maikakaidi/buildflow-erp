import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Avatar, CircularProgress, IconButton, alpha, useTheme } from '@mui/material';
import { CloudUpload, Delete, AddPhotoAlternate } from '@mui/icons-material';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';
import { db } from '../../database/schema';

interface FileUploadProps {
  label: string;
  value: string | null | string[];
  onChange: (url: string | null | string[]) => void;
  accept?: string;
  type?: 'image' | 'file';
  maxSize?: number;
  multiple?: boolean;
  offlineEntity?: string;
}

async function resolvePendingUrl(url: string): Promise<string | null> {
  if (typeof url === 'string' && url.startsWith('pending:')) {
    const token = url.slice('pending:'.length);
    try {
      const rec = await db.photoUploads.get(token);
      return rec?.blob ? URL.createObjectURL(rec.blob) : null;
    } catch {
      return null;
    }
  }
  return url || null;
}

export default function FileUpload({
  label, value, onChange, accept = 'image/*', type = 'image', maxSize = 5, multiple = false, offlineEntity = 'chantiers',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const theme = useTheme();
  const { isOnline } = useNetwork();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const multipleValues: string[] = multiple ? (Array.isArray(value) ? value.filter(Boolean) : []) : [];
  const singleValue: string | null = multiple ? null : (typeof value === 'string' ? value : null);

  useEffect(() => {
    let mounted = true;
    const resolveAll = async () => {
      const urls = multiple ? multipleValues : (singleValue ? [singleValue] : []);
      const map: Record<string, string> = {};
      for (const u of urls) {
        const r = await resolvePendingUrl(u);
        if (mounted && r) map[u] = r;
      }
      if (mounted) setPreviews(map);
    };
    resolveAll();
    return () => { mounted = false; };
  }, [multiple, multipleValues.join('|'), singleValue, refreshKey]);

  const queueOffline = async (file: File): Promise<string> => {
    const token = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.photoUploads.add({
      token,
      blob: file,
      fileName: file.name,
      entity: offlineEntity,
      createdAt: new Date().toISOString(),
    });
    return `pending:${token}`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Fichier trop volumineux (max ${maxSize} Mo)`);
      return;
    }
    setUploading(true);
    try {
      if (!isOnline) {
        const token = await queueOffline(file);
        if (multiple) {
          onChange([...multipleValues, token]);
        } else {
          onChange(token);
        }
        setRefreshKey((k) => k + 1);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        const endpoint = type === 'image' ? '/upload/image' : '/upload/file';
        const { data: res } = await api.upload(endpoint, formData);
        if (res.success) {
          if (multiple) {
            onChange([...multipleValues, res.data.url]);
          } else {
            onChange(res.data.url);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(multipleValues.filter((_, i) => i !== index));
  };

  const resolvePreview = (url: string) => previews[url] || url;

  if (multiple) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>{label}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {multipleValues.map((url, index) => (
            <Box key={url + index} sx={{ position: 'relative' }}>
              <Avatar src={resolvePreview(url)} variant="rounded" sx={{ width: 72, height: 72 }} />
              <IconButton
                size="small"
                color="error"
                onClick={() => removeAt(index)}
                sx={{
                  position: 'absolute', top: -6, right: -6,
                  bgcolor: 'background.paper', boxShadow: 1, width: 22, height: 22,
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Box>
            <input ref={inputRef} type="file" accept={accept} onChange={handleUpload} style={{ display: 'none' }} />
            <Box
              onClick={() => inputRef.current?.click()}
              sx={{
                width: 72, height: 72, borderRadius: 1, border: '1px dashed',
                borderColor: 'divider', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.2) },
              }}
            >
              {uploading ? <CircularProgress size={18} /> : <AddPhotoAlternate />}
              <Typography variant="caption">Ajouter</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <input ref={inputRef} type="file" accept={accept} onChange={handleUpload} style={{ display: 'none' }} />
      {type === 'image' && singleValue ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={resolvePreview(singleValue)} sx={{ width: 80, height: 80 }} variant="rounded" />
          <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Button size="small" startIcon={uploading ? <CircularProgress size={14} /> : <CloudUpload />}
                onClick={() => inputRef.current?.click()} disabled={uploading}>
                Changer
              </Button>
              <IconButton size="small" color="error" onClick={() => onChange(null)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Button variant="outlined" startIcon={uploading ? <CircularProgress size={14} /> : <CloudUpload />}
            onClick={() => inputRef.current?.click()} disabled={uploading} fullWidth>
            {singleValue ? `Modifier ${label}` : `Téléverser ${label}`}
          </Button>
          {singleValue && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                {singleValue.split('/').pop()}
              </Typography>
              <IconButton size="small" color="error" onClick={() => onChange(null)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
