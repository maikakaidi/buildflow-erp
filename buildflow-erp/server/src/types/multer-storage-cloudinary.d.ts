declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { UploadApiOptions } from 'cloudinary';

  interface CloudinaryStorageOptions {
    cloudinary: any;
    params?: UploadApiOptions | ((req: any, file: any) => UploadApiOptions);
    allowedFormats?: string[];
  }

  class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(...args: any[]): void;
    _removeFile(...args: any[]): void;
  }

  export { CloudinaryStorage };
}
