import { Router } from 'express';
import multer from 'multer';
import { serviceProductController } from '../controllers/serviceProductController';
import { authenticate, requireScreenAccess, requireScreenModify } from '../middlewares/auth';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع ملف Excel (.xlsx أو .xls)'));
    }
  },
});

// Middleware
router.use(authenticate);
router.use(auditMiddleware('ServiceProduct'));

// Categories routes
router.get('/categories', requireScreenAccess('serviceProducts'), serviceProductController.getAllCategories);
router.post('/categories', requireScreenModify('serviceProducts'), serviceProductController.createCategory);
router.put('/categories/:id', requireScreenModify('serviceProducts'), serviceProductController.updateCategory);
router.delete('/categories/:id', requireScreenModify('serviceProducts'), serviceProductController.deleteCategory);

// Import route
router.post('/import', requireScreenModify('serviceProducts'), upload.single('file'), serviceProductController.importFromExcel);

// Service Products routes
router.get('/', requireScreenAccess('serviceProducts'), serviceProductController.getAll);
router.get('/:id', requireScreenAccess('serviceProducts'), serviceProductController.getById);
router.post('/', requireScreenModify('serviceProducts'), serviceProductController.create);
router.put('/:id', requireScreenModify('serviceProducts'), serviceProductController.update);
router.delete('/:id', requireScreenModify('serviceProducts'), serviceProductController.delete);

export default router;
