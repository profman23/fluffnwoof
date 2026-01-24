import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../lib/prisma';

interface CreateUserInput {
  email: string;
  password: string;
  roleId: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface UpdateUserInput {
  email?: string;
  roleId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const userService = {
  /**
   * Create a new user
   */
  async create(data: CreateUserInput): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('البريد الإلكتروني موجود مسبقاً', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          role: {
            connect: { id: data.roleId },
          },
        },
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error: any) {
      // Handle unique constraint violation (race condition)
      if (error.code === 'P2002') {
        throw new AppError('البريد الإلكتروني موجود مسبقاً', 409);
      }
      // Handle foreign key constraint violation (invalid roleId)
      if (error.code === 'P2025') {
        throw new AppError('الدور المحدد غير موجود', 400);
      }
      throw error;
    }
  },

  /**
   * Find all users with pagination
   */
  async findAll(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          roleId: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              name: true,
              displayNameEn: true,
              displayNameAr: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        roleId: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
            displayNameEn: true,
            displayNameAr: true,
          },
        },
      },
    });

    return user;
  },

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserInput): Promise<Omit<User, 'password'>> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    // If email is being updated, check if it's already in use
    if (data.email && data.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailInUse) {
        throw new AppError('البريد الإلكتروني موجود مسبقاً', 400);
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        roleId: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
            displayNameEn: true,
            displayNameAr: true,
          },
        },
      },
    });

    return user;
  },

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * Reactivate user
   */
  async reactivate(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  },

  /**
   * Change user password
   */
  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  },

  /**
   * Get users by roleId
   */
  async getUsersByRole(roleId: string): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      where: { roleId, isActive: true },
      select: {
        id: true,
        email: true,
        roleId: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
            displayNameEn: true,
            displayNameAr: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return users;
  },

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    const [total, byRole, active, inactive] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['roleId'],
        _count: { roleId: true },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
      byRole: byRole.map((r) => ({ roleId: r.roleId, count: r._count.roleId })),
    };
  },
};
