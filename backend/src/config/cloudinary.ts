import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for user avatars
export const userAvatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'fluffnwoof/users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill' }],
  } as any,
});

// Storage configuration for pet photos
export const petPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'fluffnwoof/pets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  } as any,
});

// Storage configuration for medical attachments (images and PDFs)
export const medicalAttachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'fluffnwoof/medical',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
    resource_type: 'auto',
  } as any,
});

// Storage configuration for clinic logo
export const clinicLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'fluffnwoof/clinic',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 300, height: 300, crop: 'fit' }],
  } as any,
});

export default cloudinary;
