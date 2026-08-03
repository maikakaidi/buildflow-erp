import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import logger from '../config/logger';

const SALT_ROUNDS = 12;

export class AuthService {
  static async register(data: any) {
    const existingCompany = await prisma.company.findUnique({
      where: { slug: data.companySlug },
    });
    if (existingCompany) {
      throw new AppError('Ce nom d\'entreprise est déjà utilisé', 409);
    }

    const existingUser = await prisma.user.findFirst({
      where: { phoneCode: data.phoneCode, phone: data.phone },
    });
    if (existingUser) {
      throw new AppError('Ce numéro de téléphone est déjà utilisé', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug: data.companySlug,
          logo: data.logo,
          country: data.country,
          address: data.address,
          phone: `${data.phoneCode}${data.phone}`,
          email: data.directorEmail,
          directorName: `${data.directorFirstName} ${data.directorLastName}`,
        },
      });

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          firstName: data.directorFirstName,
          lastName: data.directorLastName,
          email: data.directorEmail,
          phone: data.phone,
          phoneCode: data.phoneCode,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      await tx.subscription.create({
        data: {
          companyId: company.id,
          plan: 'TRIAL',
          status: 'TRIAL',
          startDate: now,
          endDate: trialEnd,
        },
      });

      await tx.companySetting.create({
        data: { companyId: company.id },
      });

      return { company, user };
    });

    const tokens = await this.generateTokens(result.user, result.company.id);

    logger.info(`Nouvelle entreprise créée: ${result.company.name}`);

    return {
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        phone: result.user.phone,
        phoneCode: result.user.phoneCode,
        role: result.user.role,
        isSuperAdmin: result.user.isSuperAdmin,
        companyId: result.user.companyId,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
        logo: result.company.logo,
        primaryColor: result.company.primaryColor,
        secondaryColor: result.company.secondaryColor,
        currency: result.company.currency,
        language: result.company.language,
        timezone: result.company.timezone,
        maxUsers: result.company.maxUsers,
      },
      ...tokens,
    };
  }

  static async login(data: { phoneCode: string; phone: string; password: string }) {
    const user = await prisma.user.findFirst({
      where: { phoneCode: data.phoneCode, phone: data.phone },
      include: { company: true },
    });

    if (!user) {
      throw new AppError('Numéro ou mot de passe incorrect', 401);
    }

    if (!user.isActive) {
      throw new AppError('Compte désactivé', 403);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Numéro ou mot de passe incorrect', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    if (!user.isSuperAdmin && user.companyId) {
      const subscription = await prisma.subscription.findFirst({
        where: { companyId: user.companyId },
        orderBy: { createdAt: 'desc' },
      });

      if (subscription && subscription.endDate < new Date() && subscription.status !== 'EXPIRED') {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });
      }
    }

    const tokens = await this.generateTokens(user, user.companyId || undefined);

    logger.info(`Connexion: ${user.firstName} ${user.lastName}`);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        phoneCode: user.phoneCode,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        companyId: user.companyId,
      },
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            slug: user.company.slug,
            logo: user.company.logo,
            primaryColor: user.company.primaryColor,
            secondaryColor: user.company.secondaryColor,
            currency: user.company.currency,
            language: user.company.language,
            timezone: user.company.timezone,
            maxUsers: user.company.maxUsers,
          }
        : null,
      ...tokens,
    };
  }

  static async refreshAccessToken(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token invalide ou expiré', 401);
    }

    const company = storedToken.user.companyId
      ? await prisma.company.findUnique({ where: { id: storedToken.user.companyId } })
      : null;

    const accessToken = jwt.sign(
      {
        id: storedToken.user.id,
        companyId: storedToken.user.companyId,
        role: storedToken.user.role,
        isSuperAdmin: storedToken.user.isSuperAdmin,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    return { accessToken };
  }

  static async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId } });
    } else {
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  static async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private static async generateTokens(user: any, companyId?: string) {
    const payload = {
      id: user.id,
      companyId,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = uuidv4();
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
      },
    });

    return { accessToken, refreshToken };
  }
}
