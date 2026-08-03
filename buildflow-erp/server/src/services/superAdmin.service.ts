import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import logger from '../config/logger';

const SALT_ROUNDS = 12;

export class SuperAdminService {
  static async getDashboard() {
    const [companies, users, subscriptions, recentLogins] = await Promise.all([
      prisma.company.findMany({
        include: {
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { users: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
      prisma.subscription.groupBy({ by: ['status'], _count: true }),
      prisma.user.findMany({
        where: { lastLoginAt: { not: null } },
        select: { firstName: true, lastName: true, lastLoginAt: true, company: { select: { name: true } } },
        orderBy: { lastLoginAt: 'desc' },
        take: 20,
      }),
    ]);

    const totalRevenue = await prisma.subscription.aggregate({
      where: { plan: 'PAID', status: 'ACTIVE' },
      _sum: { amount: true },
    });

    const trialCount = subscriptions.find((s) => s.status === 'TRIAL')?._count || 0;
    const activeCount = subscriptions.find((s) => s.status === 'ACTIVE')?._count || 0;
    const expiredCount = subscriptions.find((s) => s.status === 'EXPIRED')?._count || 0;
    const suspendedCount = subscriptions.find((s) => s.status === 'SUSPENDED')?._count || 0;

    return {
      stats: {
        totalCompanies: companies.length,
        totalUsers: users,
        trialSubscriptions: trialCount,
        activeSubscriptions: activeCount,
        expiredSubscriptions: expiredCount,
        suspendedSubscriptions: suspendedCount,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      companies,
      recentLogins,
    };
  }

  static async createCompany(data: any) {
    const existing = await prisma.company.findUnique({ where: { slug: data.slug } });
    if (existing) throw new AppError('Ce slug est déjà utilisé', 409);

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.name,
          slug: data.slug,
          country: data.country || 'Niger',
          phone: `${data.phoneCode}${data.phone}`,
          email: data.email,
          directorName: `${data.directorFirstName} ${data.directorLastName}`,
          logo: data.logo,
          address: data.address,
          maxUsers: data.maxUsers,
        },
      });

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          firstName: data.directorFirstName,
          lastName: data.directorLastName,
          email: data.email,
          phone: data.phone,
          phoneCode: data.phoneCode || '+227',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      await tx.subscription.create({
        data: {
          companyId: company.id,
          plan: data.plan || 'TRIAL',
          status: data.plan === 'PAID' ? 'ACTIVE' : 'TRIAL',
          startDate: now,
          endDate: data.plan === 'PAID'
            ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
            : trialEnd,
          amount: data.plan === 'PAID' ? 80000 : 0,
        },
      });

      await tx.companySetting.create({ data: { companyId: company.id } });

      return { company, user };
    });

    logger.info(`Super Admin a créé l'entreprise: ${result.company.name}`);
    return result;
  }

  static async updateCompany(companyId: string, data: any) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Entreprise introuvable', 404);

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        logo: data.logo,
        address: data.address,
        phone: data.phone,
        email: data.email,
        country: data.country,
        directorName: data.directorName,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        currency: data.currency,
        language: data.language,
        timezone: data.timezone,
        maxUsers: data.maxUsers,
      },
    });

    return updated;
  }

  static async deleteCompany(companyId: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Entreprise introuvable', 404);

    await prisma.company.delete({ where: { id: companyId } });
    logger.info(`Super Admin a supprimé l'entreprise: ${company.name}`);
    return { message: 'Entreprise supprimée' };
  }

  static async suspendCompany(companyId: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Entreprise introuvable', 404);

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'SUSPENDED' },
      });
    }

    await prisma.user.updateMany({
      where: { companyId },
      data: { isActive: false },
    });

    logger.info(`Super Admin a suspendu l'entreprise: ${company.name}`);
    return { message: 'Entreprise suspendue' };
  }

  static async reactivateCompany(companyId: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Entreprise introuvable', 404);

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' },
      });
    }

    await prisma.user.updateMany({
      where: { companyId },
      data: { isActive: true },
    });

    logger.info(`Super Admin a réactivé l'entreprise: ${company.name}`);
    return { message: 'Entreprise réactivée' };
  }

  static async renewSubscription(companyId: string, days: number = 365) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Entreprise introuvable', 404);

    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription) {
      const newStart = subscription.endDate > now ? subscription.endDate : now;
      const newEnd = new Date(newStart.getTime() + days * 24 * 60 * 60 * 1000);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: 'PAID',
          status: 'ACTIVE',
          startDate: newStart,
          endDate: newEnd,
          amount: 80000,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          companyId,
          plan: 'PAID',
          status: 'ACTIVE',
          startDate: now,
          endDate,
          amount: 80000,
        },
      });
    }

    logger.info(`Super Admin a renouvelé l'hébergement de: ${company.name} (${days} jours)`);
    return { message: `Hébergement renouvelé pour ${days} jours` };
  }

  static async addFreeDays(companyId: string, days: number) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Entreprise introuvable', 404);

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription) {
      const newEnd = new Date(subscription.endDate.getTime() + days * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { endDate: newEnd },
      });
    }

    logger.info(`Super Admin a ajouté ${days} jours gratuits à: ${company.name}`);
    return { message: `${days} jours ajoutés` };
  }

  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        phoneCode: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        createdAt: true,
        company: { select: { id: true, name: true, maxUsers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    return prisma.user.create({
      data: {
        companyId: data.companyId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        phoneCode: data.phoneCode || '+227',
        password: hashedPassword,
        role: data.role || 'EMPLOYEE',
      },
    });
  }

  static async resetPassword(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Utilisateur introuvable', 404);

    const tempPassword = 'Reset@' + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { tempPassword, message: `Mot de passe réinitialisé. Nouveau mot de passe: ${tempPassword}` };
  }

  static async getPayments() {
    return prisma.paymentInfo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updatePaymentInfo(data: any) {
    if (data.id) {
      return prisma.paymentInfo.update({
        where: { id: data.id },
        data: {
          amount: data.amount,
          duration: data.duration,
          methods: data.methods,
          instructions: data.instructions,
          currency: data.currency,
        },
      });
    }
    return prisma.paymentInfo.create({
      data: {
        amount: data.amount || 80000,
        duration: data.duration || 365,
        methods: data.methods || [],
        instructions: data.instructions,
        currency: data.currency || 'FCFA',
      },
    });
  }

  static async getStats() {
    const [totalCompanies, totalUsers, revenue, syncLogs] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.subscription.aggregate({ _sum: { amount: true }, where: { plan: 'PAID' } }),
      prisma.syncLog.count(),
    ]);

    const recentCompanies = await prisma.company.findMany({
      where: {
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      totalCompanies,
      totalUsers,
      totalRevenue: revenue._sum.amount || 0,
      totalSyncs: syncLogs,
    };
  }
}
