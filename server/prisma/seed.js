import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bankInfo = {
    bankName: 'NCBA, Kenya',
    bankCode: '07000',
    branch: 'Yaya Centre (Code-030)',
    accountName: 'Ladina Travel Safaris Ltd',
    accountNumberUSD: '5213170028',
    accountNumberKES: '5213170012',
    swiftCode: 'CBAFKENX'
  };

  await prisma.bankDetails.upsert({
    where: { id: 'current' },
    update: {},
    create: { id: 'current', ...bankInfo },
  });

  console.log('✓ Initialized Bank Details in Database');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
