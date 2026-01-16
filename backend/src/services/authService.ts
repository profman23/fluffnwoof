import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middlewares/errorHandler';
import { t } from '../utils/i18n';

export const authService = {
  async register(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleId?: string;
    },
    lang: string = 'ar'
  ) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(t('auth.emailExists', lang), 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        phone: true,
        createdAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role.name,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { user, token };
  },

  async login(email: string, password: string, lang: string = 'ar') {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(t('auth.invalidCredentials', lang), 401);
    }

    if (!user.isActive) {
      throw new AppError(t('auth.accountDisabled', lang), 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(t('auth.invalidCredentials', lang), 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role.name,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  },

  async getProfile(userId: string, lang: string = 'ar') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
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
    });

    if (!user) {
      throw new AppError(t('auth.userNotFound', lang), 404);
    }

    return user;
  },
};
