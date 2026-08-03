import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { storage, useCloudinary, uploadsDir, toFileUrl } from '../config/storage';

const router = Router();

const imageUpload = multer({
  storage: storage(true),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format d'image non supporté (JPEG, PNG, WebP, SVG)"));
  },
});

const fileUpload = multer({
  storage: storage(false),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format de fichier non supporté'));
  },
});

router.post('/image', authenticate, imageUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier' });
  res.json({ success: true, data: { url: toFileUrl(req.file), filename: req.file.filename } });
});

router.post('/file', authenticate, fileUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier' });
  res.json({
    success: true,
    data: {
      url: toFileUrl(req.file),
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

router.delete('/:filename', authenticate, async (req, res) => {
  if (useCloudinary) {
    try {
      const publicId = req.params.filename;
      await cloudinary.uploader.destroy(publicId);
      return res.json({ success: true, message: 'Fichier supprimé' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Erreur de suppression' });
    }
  }
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true, message: 'Fichier supprimé' });
  }
  res.status(404).json({ success: false, message: 'Fichier introuvable' });
});

export default router;
