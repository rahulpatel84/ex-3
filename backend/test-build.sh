#!/bin/bash

# Test Build Script - Simulates Railway deployment locally
# Run this before deploying to catch issues early!

echo "🧪 Testing Railway Deployment Build Process..."
echo "=============================================="
echo ""

# Step 1: Clean previous build
echo "📦 Step 1: Cleaning previous build..."
rm -rf dist node_modules
echo "✅ Cleaned"
echo ""

# Step 2: Install dependencies (like Railway does)
echo "📦 Step 2: Installing dependencies..."
npm ci
if [ $? -ne 0 ]; then
    echo "❌ npm ci failed!"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 3: Generate Prisma Client
echo "📦 Step 3: Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed!"
    exit 1
fi
echo "✅ Prisma client generated"
echo ""

# Step 4: Build application
echo "📦 Step 4: Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Step 5: Check if dist/main.js exists
echo "📦 Step 5: Checking build output..."
if [ -f "dist/main.js" ]; then
    echo "✅ dist/main.js exists"
else
    echo "❌ dist/main.js NOT found!"
    exit 1
fi
echo ""

# Step 6: Show dist folder structure
echo "📦 Step 6: Build output structure:"
ls -lR dist/ | head -20
echo ""

echo "=============================================="
echo "🎉 BUILD TEST PASSED!"
echo "Your app is ready to deploy to Railway!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Ready for deployment'"
echo "2. Push to GitHub: git push"
echo "3. Railway will auto-deploy!"

