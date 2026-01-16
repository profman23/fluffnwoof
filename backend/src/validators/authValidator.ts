import { body } from 'express-validator';

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('الاسم الأول مطلوب')
    .isLength({ min: 2 })
    .withMessage('الاسم الأول يجب أن يكون حرفين على الأقل'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('الاسم الأخير مطلوب')
    .isLength({ min: 2 })
    .withMessage('الاسم الأخير يجب أن يكون حرفين على الأقل'),
  body('phone')
    .optional()
    .isMobilePhone('ar-EG')
    .withMessage('رقم الهاتف غير صالح'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'VET', 'RECEPTIONIST'])
    .withMessage('الدور غير صالح'),
];

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة'),
];
