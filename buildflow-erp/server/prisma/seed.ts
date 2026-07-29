import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('SuperAdmin@2024', 12);

  const existing = await prisma.user.findFirst({
    where: { phone: '00000000', phoneCode: '+227' },
  });

  let superAdmin;
  if (existing) {
    superAdmin = existing;
  } else {
    superAdmin = await prisma.user.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@buildflow-erp.com',
        phone: '00000000',
        phoneCode: '+227',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
      },
    });
  }

  console.log('Super Admin créé:', superAdmin.firstName, superAdmin.lastName);

  const existingPayment = await prisma.paymentInfo.findFirst();
  if (!existingPayment) {
    await prisma.paymentInfo.create({
      data: {
        id: 'default',
        amount: 80000,
        duration: 365,
        methods: JSON.stringify([
          { name: 'Amanata', number: '92666942', accountName: 'BuildFlow ERP' },
          { name: 'Nita', number: '99293329', accountName: 'BuildFlow ERP' },
        ]),
        instructions: 'Envoyer le montant sur le numéro indiqué puis confirmer avec la référence.',
      },
    });
  }

  console.log('Payment Info par défaut créé');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
