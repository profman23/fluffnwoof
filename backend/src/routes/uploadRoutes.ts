import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { userAvatarStorage, petPhotoStorage, medicalAttachmentStorage } from '../config/cloudinary';
import {
  uploadUserAvatar,
  removeUserAvatar,
  uploadPetPhoto,
  removePetPhoto,
  uploadMedicalAttachment,
  getMedicalAttachments,
  deleteMedicalAttachment,
} from '../controllers/uploadController';

const router = Router();

// Configure multer for different upload types
const userAvatarUpload = multer({
  storage: userAvatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max for avatars
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  },
});

const petPhotoUpload = multer({
  storage: petPhotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for pet photos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  },
});

const medicalAttachmentUpload = multer({
  storage: medicalAttachmentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for medical attachments
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and PDF are allowed.'));
    }
  },
});

// Error handling middleware for multer errors
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// User avatar routes
router.post(
  '/user-avatar',
  authenticate,
  userAvatarUpload.single('avatar'),
  handleMulterError,
  uploadUserAvatar
);

router.delete(
  '/user-avatar',
  authenticate,
  removeUserAvatar
);

// Pet photo routes
router.post(
  '/pet/:petId/photo',
  authenticate,
  petPhotoUpload.single('photo'),
  handleMulterError,
  uploadPetPhoto
);

router.delete(
  '/pet/:petId/photo',
  authenticate,
  removePetPhoto
);

// Medical attachment routes
router.post(
  '/medical/:recordId/attachment',
  authenticate,
  medicalAttachmentUpload.single('file'),
  handleMulterError,
  uploadMedicalAttachment
);

router.get(
  '/medical/:recordId/attachments',
  authenticate,
  getMedicalAttachments
);

router.delete(
  '/medical/attachment/:attachmentId',
  authenticate,
  deleteMedicalAttachment
);

export default router;
