import React, { useRef, useState } from 'react';
import { Box, Button, Typography, Avatar, CircularProgress, IconButton } from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import api from '../../api/client';

interface FileUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  type?: 'image' | 'file';
  maxSize?: number;
}

export default function FileUpload({ label, value, onChange, accept = 'image/*', type = 'image', maxSize = 5 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Fichier trop volumineux (max ${maxSize} Mo)`);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const endpoint = type === 'image' ? '/upload/image' : '/upload/file';
      const { data: res } = await api.upload(endpoint, formData);
      if (res.success) onChange(res.data.url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Box>
      <input ref={inputRef} type="file" accept={accept} onChange={handleUpload} style={{ display: 'none' }} />
      {type === 'image' && value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={value} sx={{ width: 80, height: 80 }} variant="rounded" />
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
            {value ? `Modifier ${label}` : `Téléverser ${label}`}
          </Button>
          {value && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>{value.split('/').pop()}</Typography>
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
