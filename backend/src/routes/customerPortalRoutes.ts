import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import customerPortalController from '../controllers/customerPortalController';
import { customerAuth } from '../middlewares/customerAuth';
import { petPhotoStorage } from '../config/cloudinary';
import {
  emailCheckLimiter,
  otpLimiter,
  loginLimiter,
  registrationLimiter,
  passwordResetLimiter,
  bookingLimiter,
  portalApiLimiter,
} from '../middlewares/rateLimiter';

// Configure multer for pet photo uploads
const petPhotoUpload = multer({
  storage: petPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG أو WebP'));
    }
  },
});

// Handle multer errors
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

const router = Router();

// Apply general rate limiter to all portal routes
router.use(portalApiLimiter);

// =====================================
// Public Auth Endpoints (no authentication required)
// =====================================

// Phone check (for smart registration flow)
router.post('/check-phone', emailCheckLimiter, customerPortalController.checkPhone);

// Registration flow (phone-first)
router.post('/register', registrationLimiter, customerPortalController.register);
router.post('/verify-otp', otpLimiter, customerPortalController.verifyOtp);
router.post('/resend-otp', otpLimiter, customerPortalController.resendOtp);
router.post('/complete-registration', customerPortalController.completeRegistration);

// Login (phone + password)
router.post('/login', loginLimiter, customerPortalController.login);

// Password reset flow (phone-based SMS OTP)
router.post('/forgot-password', passwordResetLimiter, customerPortalController.forgotPassword);
router.post('/reset-password', customerPortalController.resetPassword);

// =====================================
// Public Booking Data Endpoints (no authentication required)
// =====================================

// Visit types and vets (available to everyone for browsing)
router.get('/visit-types', customerPortalController.getVisitTypes);
router.get('/vets', customerPortalController.getVets);
router.get('/availability/:vetId/:date', customerPortalController.getAvailability);

// =====================================
// Protected Endpoints (authentication required)
// =====================================

// Profile
router.get('/me', customerAuth, customerPortalController.getProfile);
router.put('/me', customerAuth, customerPortalController.updateProfile);

// Pets
router.get('/pets', customerAuth, customerPortalController.getPets);
router.get('/pets/:id', customerAuth, customerPortalController.getPetById);
router.post('/pets', customerAuth, customerPortalController.addPet);
router.put('/pets/:id', customerAuth, customerPortalController.updatePet);

// Pet Photo Upload
router.post(
  '/pets/:id/photo',
  customerAuth,
  petPhotoUpload.single('photo'),
  handleMulterError,
  customerPortalController.uploadPetPhoto
);
router.delete('/pets/:id/photo', customerAuth, customerPortalController.removePetPhoto);

// Appointments
router.get('/appointments', customerAuth, customerPortalController.getAppointments);
router.get('/appointments/:id', customerAuth, customerPortalController.getAppointmentById);
router.post('/appointments', customerAuth, bookingLimiter, customerPortalController.bookAppointment);
router.delete('/appointments/:id', customerAuth, customerPortalController.cancelAppointment);

// Forms
router.get('/forms', customerAuth, customerPortalController.getForms);
router.get('/forms/:id', customerAuth, customerPortalController.getFormById);
router.post('/forms/:id/sign', customerAuth, customerPortalController.signForm);

export default router;
