import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting bank accounts seed...');

  const bankData = [
    {
      bankName: 'NCBA, Kenya',
      bankCode: '07000',
      branch: 'Yaya Centre (Code-030)',
      accountName: 'Ladina Travel Safaris Ltd',
      accountNumber: '5213170012',
      currency: 'KES',
      swiftCode: 'CBAFKENX',
      isDefault: true
    },
    {
      bankName: 'NCBA, Kenya',
      bankCode: '07000',
      branch: 'Yaya Centre (Code-030)',
      accountName: 'Ladina Travel Safaris Ltd',
      accountNumber: '5213170028',
      currency: 'USD',
      swiftCode: 'CBAFKENX',
      isDefault: false
    }
  ];

  // Use upsert so we don't create duplicates
  for (const account of bankData) {
    await prisma.bankAccount.upsert({
      where: {
        accountNumber_currency: {
          accountNumber: account.accountNumber,
          currency: account.currency
        }
      },
      update: account,
      create: account,
    });
    console.log(`Seeded ${account.currency} account`);
  }

  console.log('Bank accounts seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during bank accounts seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
