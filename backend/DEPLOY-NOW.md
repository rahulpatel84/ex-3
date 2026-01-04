# 🚀 Deploy to Railway - Quick Guide

## ✅ Pre-Flight Check (30 seconds)

Run this in your terminal:

```bash
cd /Users/rahul/Desktop/Projects/version1/backend

# Check if config files exist
echo "Checking configuration files..."
[ -f railway.json ] && echo "✅ railway.json" || echo "❌ railway.json MISSING"
[ -f nixpacks.toml ] && echo "✅ nixpacks.toml" || echo "❌ nixpacks.toml MISSING"
[ -f .npmrc ] && echo "✅ .npmrc" || echo "❌ .npmrc MISSING"
[ -f package.json ] && echo "✅ package.json" || echo "❌ package.json MISSING"
```

All should show ✅. If any show ❌, something went wrong!

## 🧪 Test Build Locally (2 minutes)

```bash
./test-build.sh
```

If this passes, your Railway deployment will work!

## 📤 Deploy to Railway

### Option 1: Auto-Deploy from GitHub (Recommended)

```bash
# Add all files
git add .

# Commit
git commit -m "Fix Railway deployment configuration"

# Push (Railway auto-deploys)
git push
```

### Option 2: Deploy with Railway CLI

```bash
# Login (if not already)
railway login

# Deploy
railway up
```

## 🔍 Monitor Deployment

1. Go to [railway.app](https://railway.app)
2. Click your project
3. Click backend service
4. Click "Deployments" → Latest
5. Click "View Logs"

### What to look for:

**✅ Success:**
```
Running build command: npm ci && npx prisma generate && npm run build
Building...
Successfully compiled: X files
Starting application...
NestFactory Creating Nest application...
ExpenseAI Backend is running
```

**❌ Failure:**
```
Error: Cannot find module '/app/dist/main'
```

If you see the failure, make sure you pushed all 3 config files!

## 🎯 Test Your Live Backend

```bash
# Replace with YOUR Railway URL
curl https://your-app.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","database":"connected"}
```

## 🎉 Success!

Your backend is live! Now update your frontend's `VITE_API_URL` to point to your Railway URL.

---

**Still having issues?** Read `RAILWAY-DEPLOYMENT-FIX.md` for detailed troubleshooting.

