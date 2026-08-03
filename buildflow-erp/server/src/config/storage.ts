import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const cloudinaryUrl = process.env.CLOUDINARY_URL;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const useCloudinary = !!(cloudinaryUrl || (cloudName && apiKey && apiSecret));

if (useCloudinary && !cloudinaryUrl) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export const uploadsDir = path.join(__dirname, '../../uploads');

const LOCAL_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
const LOCAL_FILE_FORMATS = [...LOCAL_IMAGE_FORMATS, 'pdf', 'doc', 'docx', 'xls', 'xlsx'];

export const storage = (imageOnly: boolean): multer.StorageEngine => {
  if (useCloudinary) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'buildflow-erp',
        resource_type: 'auto',
        allowed_formats: imageOnly ? LOCAL_IMAGE_FORMATS : LOCAL_FILE_FORMATS,
      },
    });
  }
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });
};

export const toFileUrl = (file: Express.Multer.File): string =>
  useCloudinary ? file.path : `/uploads/${file.filename}`;
