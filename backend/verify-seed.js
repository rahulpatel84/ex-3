// Verify seed data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySeed() {
  try {
    console.log('🔍 Verifying seed data...\n');

    // Get first user
    const user = await prisma.user.findFirst();

    if (!user) {
      console.log('❌ No users found');
      return;
    }

    console.log(`👤 Checking categories for: ${user.email}\n`);

    // Get all categories for this user
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    console.log(`📊 Total categories: ${categories.length}\n`);

    // Group by type
    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');

    console.log('💸 EXPENSE CATEGORIES:');
    expenseCategories.forEach((cat) => {
      console.log(`   ${cat.icon} ${cat.name} (${cat.color})`);
    });

    console.log('\n💰 INCOME CATEGORIES:');
    incomeCategories.forEach((cat) => {
      console.log(`   ${cat.icon} ${cat.name} (${cat.color})`);
    });

    console.log('\n✅ Seed verification complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeed();
