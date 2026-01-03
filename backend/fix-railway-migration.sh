#!/bin/bash

# Fix Railway Prisma Migration Issue
# This script resolves the failed migration and re-runs it

echo "🔧 Fixing Railway Prisma Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "To fix this:"
  echo "1. Go to your Railway project"
  echo "2. Click on the PostgreSQL database"
  echo "3. Go to the 'Connect' tab"
  echo "4. Copy the 'Postgres Connection URL'"
  echo "5. Run this command in your terminal:"
  echo ""
  echo "   export DATABASE_URL='your-railway-database-url-here'"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📝 Step 1: Marking failed migration as rolled back..."
npx prisma migrate resolve --rolled-back "20241230170000_init"

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Failed to mark migration as rolled back"
  echo ""
  echo "Alternative: Reset the database (THIS WILL DELETE ALL DATA)"
  echo "If you want to reset the database, run:"
  echo "   npx prisma migrate reset --force"
  exit 1
fi

echo ""
echo "✅ Migration marked as rolled back"
echo ""

echo "📝 Step 2: Running migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Migration deployment failed"
  exit 1
fi

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "🎉 Railway database is now fixed!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub (if not already done)"
echo "2. Railway will automatically redeploy"
echo "3. Wait for deployment to complete"
echo ""
