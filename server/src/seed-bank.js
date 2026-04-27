import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting bank details migration...');

  const bankData = {
    id: 'current',
    bankName: 'NCBA, Kenya',
    bankCode: '07000',
    branch: 'Yaya Centre (Code-030)',
    accountName: 'Ladina Travel Safaris Ltd',
    accountNumberUSD: '5213170028',
    accountNumberKES: '5213170012',
    swiftCode: 'CBAFKENX'
  };

  try {
    const result = await prisma.bankDetails.upsert({
      where: { id: 'current' },
      update: bankData,
      create: bankData,
    });
    console.log('Bank details updated successfully:', result);
  } catch (error) {
    console.error('Error updating bank details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
