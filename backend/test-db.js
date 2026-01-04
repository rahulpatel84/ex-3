// Quick test to verify Category and Expense tables exist
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTables() {
  try {
    console.log('🔍 Testing database tables...\n');

    // Test 1: Can we query categories table?
    console.log('📁 Testing categories table...');
    const categoryCount = await prisma.category.count();
    console.log(`✅ Categories table exists! Count: ${categoryCount}\n`);

    // Test 2: Can we query expenses table?
    console.log('💰 Testing expenses table...');
    const expenseCount = await prisma.expense.count();
    console.log(`✅ Expenses table exists! Count: ${expenseCount}\n`);

    // Test 3: Check existing users
    console.log('👥 Checking users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Users table has ${userCount} users\n`);

    console.log('🎉 All tables verified successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTables();
