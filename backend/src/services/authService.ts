import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middlewares/errorHandler';
import { t } from '../utils/i18n';

// JWT options
const jwtOptions: SignOptions = {
  expiresIn: '7d',
};

export const authService = {
  async register(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleId: string;
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
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roleId: data.roleId,
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
      jwtOptions
    );

    return { user, token };
  },

  async login(email: string, password: string, lang: string = 'ar') {
    // Normalize email to lowercase for case-insensitive matching
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
      jwtOptions
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
