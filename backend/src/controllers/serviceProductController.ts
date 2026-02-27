import { Request, Response, NextFunction } from 'express';
import { serviceProductService } from '../services/serviceProductService';
import * as XLSX from 'xlsx';

export const serviceProductController = {
  // Categories
  getAllCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await serviceProductService.getAllCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  createCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;
      const category = await serviceProductService.createCategory({ name });
      res.status(201).json({
        success: true,
        message: 'تم إنشاء التصنيف بنجاح',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  updateCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const category = await serviceProductService.updateCategory(id, { name });
      res.json({
        success: true,
        message: 'تم تحديث التصنيف بنجاح',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await serviceProductService.deleteCategory(id);
      res.json({
        success: true,
        message: 'تم حذف التصنيف بنجاح',
      });
    } catch (error: any) {
      if (error.message === 'Cannot delete category with existing items') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف التصنيف لوجود عناصر مرتبطة به',
        });
      }
      next(error);
    }
  },

  // Service Products
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, categoryId } = req.query;
      const result = await serviceProductService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        categoryId: categoryId as string,
      });
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await serviceProductService.getById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'العنصر غير موجود',
        });
      }
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await serviceProductService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'تم إنشاء العنصر بنجاح',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await serviceProductService.update(id, req.body);
      res.json({
        success: true,
        message: 'تم تحديث العنصر بنجاح',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await serviceProductService.delete(id);
      res.json({
        success: true,
        message: 'تم حذف العنصر بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ids must be a non-empty array',
        });
      }

      if (ids.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete more than 100 items at once',
        });
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!ids.every((id: unknown) => typeof id === 'string' && uuidRegex.test(id))) {
        return res.status(400).json({
          success: false,
          message: 'All ids must be valid UUIDs',
        });
      }

      const result = await serviceProductService.bulkDelete(ids);
      res.json({
        success: true,
        message: `تم حذف ${result.deletedCount} عنصر بنجاح`,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Some items not found or already deleted') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Import from Excel
  importFromExcel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم رفع ملف',
        });
      }

      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header row and map data
      // Columns: A=Name, C=Category, F=PriceBeforeTax, G=TaxRate, H=PriceAfterTax
      const items = data.slice(1).filter(row => row[0]).map(row => ({
        name: String(row[0] || '').trim(),
        category: String(row[2] || '').trim(),
        priceBeforeTax: parseFloat(row[5]) || 0,
        taxRate: parseFloat(row[6]) || 0,
        priceAfterTax: parseFloat(row[7]) || 0,
      }));

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'الملف لا يحتوي على بيانات صالحة',
        });
      }

      const results = await serviceProductService.importFromExcel(items);

      res.json({
        success: true,
        message: `تم استيراد ${results.success} عنصر بنجاح${results.failed > 0 ? `، فشل ${results.failed}` : ''}`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },
};
