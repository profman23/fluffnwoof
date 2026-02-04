import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

interface ServiceProductInput {
  name: string;
  categoryId: string;
  priceBeforeTax: number;
  taxRate: number;
  priceAfterTax: number;
}

interface CategoryInput {
  name: string;
}

interface ImportItem {
  name: string;
  category: string;
  priceBeforeTax: number;
  taxRate: number;
  priceAfterTax: number;
}

export const serviceProductService = {
  // Categories
  getAllCategories: async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  createCategory: async (data: CategoryInput) => {
    return prisma.category.create({
      data: {
        name: data.name,
      },
    });
  },

  updateCategory: async (id: string, data: CategoryInput) => {
    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
  },

  deleteCategory: async (id: string) => {
    // Check if category has items
    const itemsCount = await prisma.serviceProduct.count({
      where: { categoryId: id },
    });

    if (itemsCount > 0) {
      throw new Error('Cannot delete category with existing items');
    }

    return prisma.category.delete({
      where: { id },
    });
  },

  // Service Products
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  }) => {
    const { page = 1, limit = 20, search, categoryId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceProductWhereInput = {
      isActive: true,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [items, total] = await Promise.all([
      prisma.serviceProduct.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.serviceProduct.count({ where }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getById: async (id: string) => {
    return prisma.serviceProduct.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  },

  create: async (data: ServiceProductInput) => {
    return prisma.serviceProduct.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        priceBeforeTax: new Prisma.Decimal(data.priceBeforeTax),
        taxRate: new Prisma.Decimal(data.taxRate),
        priceAfterTax: new Prisma.Decimal(data.priceAfterTax),
      },
      include: {
        category: true,
      },
    });
  },

  update: async (id: string, data: Partial<ServiceProductInput>) => {
    const updateData: Prisma.ServiceProductUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) {
      updateData.category = { connect: { id: data.categoryId } };
    }
    if (data.priceBeforeTax !== undefined) {
      updateData.priceBeforeTax = new Prisma.Decimal(data.priceBeforeTax);
    }
    if (data.taxRate !== undefined) {
      updateData.taxRate = new Prisma.Decimal(data.taxRate);
    }
    if (data.priceAfterTax !== undefined) {
      updateData.priceAfterTax = new Prisma.Decimal(data.priceAfterTax);
    }

    return prisma.serviceProduct.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  },

  delete: async (id: string) => {
    return prisma.serviceProduct.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // Import from Excel
  importFromExcel: async (items: ImportItem[]) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const item of items) {
      try {
        // Find or create category
        let category = await prisma.category.findUnique({
          where: { name: item.category },
        });

        if (!category) {
          category = await prisma.category.create({
            data: { name: item.category },
          });
        }

        // Create service product
        await prisma.serviceProduct.create({
          data: {
            name: item.name,
            categoryId: category.id,
            priceBeforeTax: new Prisma.Decimal(item.priceBeforeTax),
            taxRate: new Prisma.Decimal(item.taxRate),
            priceAfterTax: new Prisma.Decimal(item.priceAfterTax),
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${item.name}: ${error.message}`);
      }
    }

    return results;
  },
};
