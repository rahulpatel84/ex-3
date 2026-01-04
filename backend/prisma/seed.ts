import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default categories for all users
const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Food & Dining', icon: '🍔', color: '#ef4444', type: 'expense' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense' },
  { name: 'Bills & Utilities', icon: '⚡', color: '#f59e0b', type: 'expense' },
  { name: 'Healthcare', icon: '🏥', color: '#10b981', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#6366f1', type: 'expense' },
  { name: 'Travel', icon: '✈️', color: '#14b8a6', type: 'expense' },
  { name: 'Personal Care', icon: '💅', color: '#f472b6', type: 'expense' },
  { name: 'Other', icon: '📦', color: '#6b7280', type: 'expense' },

  // Income categories
  { name: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
  { name: 'Freelance', icon: '💼', color: '#3b82f6', type: 'income' },
  { name: 'Investment', icon: '📈', color: '#8b5cf6', type: 'income' },
  { name: 'Gift', icon: '🎁', color: '#ec4899', type: 'income' },
  { name: 'Other Income', icon: '💵', color: '#10b981', type: 'income' },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    console.log(`📊 Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found. Create a user first, then run seed again.');
      return;
    }

    // Add default categories for each user
    for (const user of users) {
      console.log(`👤 Processing user: ${user.email}`);

      // Check if user already has categories
      const existingCategories = await prisma.category.count({
        where: { userId: user.id },
      });

      if (existingCategories > 0) {
        console.log(`   ⏭️  User already has ${existingCategories} categories, skipping...\n`);
        continue;
      }

      // Create default categories for this user
      const categoriesToCreate = DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        userId: user.id,
        isDefault: true, // Mark as system default
      }));

      const result = await prisma.category.createMany({
        data: categoriesToCreate,
      });

      console.log(`   ✅ Created ${result.count} default categories\n`);
    }

    // Summary
    const totalCategories = await prisma.category.count();
    console.log(`\n🎉 Seed completed successfully!`);
    console.log(`📊 Total categories in database: ${totalCategories}`);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
