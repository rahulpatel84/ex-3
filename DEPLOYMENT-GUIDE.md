
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 ExpenseAI Backend is running!                            ║
║                                                                ║
║   📍 Server:     http://localhost:3001                         ║
║   🔗 API:        http://localhost:3001/api                     ║
║   🌐 Frontend:   https://expense-v2-73arkysd0-rahul-patels-projects-d1834862.vercel.app                    ║
║   📊 Health:     http://localhost:3001/api/health              ║
║                                                                ║
║   Environment:   production                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  
✅ Email sent to test1@test.com: Verify your email address
📝 Audit log: USER_SIGNUP by 62b5371a-e5b5-4d40-b3ea-83285dcd4a84
✅ User signed up: test1@test.com
✅ Email sent to test1s@test.com: Verify your email address
📝 Audit log: USER_SIGNUP by cba59c69-4c07-4933-afdf-e94c3d8f82c4
✅ User signed up: test1s@test.com# 🚀 Deployment Guide - ExpenseTracker

Complete guide to deploy your app to production for **FREE**!

---

## 🎯 What We're Deploying

- **Backend + Database** → Railway (Free tier)
- **Frontend** → Vercel (Free tier, unlimited)

---

## ✅ Pre-Deployment Checklist

Before deploying, make sure these configuration files exist in your `backend/` folder:

- ✅ `package.json` - Scripts and dependencies
- ✅ `railway.json` - Railway build configuration  
- ✅ `nixpacks.toml` - Nixpacks build settings (ensures all deps install)
- ✅ `.npmrc` - NPM configuration (prevents skipping devDependencies)
- ✅ `prisma/schema.prisma` - Database schema

**These files are already set up for you!** Just make sure they're committed to git.

---

## Part 1: Deploy Backend + Database (Railway)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** or **"Start a New Project"**
3. **Sign up with GitHub** (easiest - connects your repos)
4. Verify your email if prompted

### Step 2: Create New Project

1. In Railway dashboard, click **"New Project"**
2. Select **"Provision PostgreSQL"**
3. Railway creates a PostgreSQL database instantly
4. You'll see a new PostgreSQL service in your project

### Step 3: Get Database Connection String

1. Click on the **PostgreSQL** service
2. Go to **"Variables"** tab
3. Find `DATABASE_URL` - this is your connection string
4. It looks like:
   ```
   postgresql://postgres:PASSWORD@HOST:PORT/railway
   ```
5. **Click the copy icon** to copy it (we'll use this later)

### Step 4: Deploy Backend Code

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub first (if not already):
   ```bash
   cd /Users/rahul/Desktop/Projects/expense-tracker/version1/backend
   git init
   git add .
   git commit -m "Ready for deployment"
   git remote add origin https://github.com/YOUR-USERNAME/expense-tracker.git
   git push -u origin main
   ```

2. In Railway, click **"New"** → **"GitHub Repo"**
3. Select your **expense-tracker** repository
4. Select the **backend** folder (or root if backend is in root)
5. Railway will auto-detect it's a Node.js app

#### Option B: Deploy via Railway CLI

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   cd /Users/rahul/Desktop/Projects/expense-tracker/version1/backend
   railway link
   ```

4. Deploy:
   ```bash
   railway up
   ```

### Step 5: Add Environment Variables

1. Click on your **backend service** in Railway
2. Go to **"Variables"** tab
3. Add these variables:

```
DATABASE_URL = (paste the PostgreSQL DATABASE_URL from Step 3)
JWT_SECRET = (generate a secure one - see below)
JWT_EXPIRES_IN = 15m
PORT = 3001
NODE_ENV = production
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as `JWT_SECRET`

### Step 6: Run Database Migrations

Railway needs to create your database tables. Two options:

#### Option A: Automatic (if Railway detects package.json)

Railway will automatically run:
1. `npm install`
2. `npm run build`
3. `npm start`

But we need to run migrations. Add a **start script** that includes migration:

In Railway, go to **Settings** → **Deploy** → **Custom Start Command**:
```bash
npm run deploy:migrate && npm start
```

#### Option B: Manual (via Railway CLI)

```bash
railway run npx prisma migrate deploy
```

### Step 7: Test Backend

1. In Railway, go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. You'll get a public URL like: `https://your-app.up.railway.app`
4. Test it: `https://your-app.up.railway.app/health`
5. You should see: `{ "status": "ok", "database": "connected" }`

**Your backend is live!** 🎉

---

## Part 2: Deploy Frontend (Vercel)

### Step 1: Update Frontend API URL

Before deploying, update your frontend to use the production backend URL:

1. Create `.env` file in `version1/frontend/`:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   ```

2. Update `src/services/api.ts` (or wherever you call the API):
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
   ```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. **Sign up with GitHub** (easiest)

### Step 3: Deploy Frontend

#### Option A: Deploy from GitHub (Recommended)

1. Push frontend to GitHub (if not already)
2. In Vercel dashboard, click **"Add New"** → **"Project"**
3. **Import** your GitHub repository
4. Vercel auto-detects it's a Vite app
5. **Root Directory**: Set to `version1/frontend` (if needed)
6. Click **"Deploy"**

#### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd /Users/rahul/Desktop/Projects/expense-tracker/version1/frontend
   vercel
   ```

3. Follow prompts:
   - Link to existing project? **No**
   - Project name? **expense-tracker**
   - Directory? **./** (current directory)

### Step 4: Add Environment Variables in Vercel

1. In Vercel project, go to **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_URL = https://your-app.up.railway.app
   ```
3. Click **"Save"**
4. **Redeploy** the project (Settings → Deployments → redeploy latest)

### Step 5: Test Frontend

1. Vercel gives you a URL like: `https://expense-tracker-xyz.vercel.app`
2. Open it in browser
3. Test signup, login, dashboard!

**Your frontend is live!** 🎉

---

## Part 3: Enable CORS (Important!)

Your backend needs to allow requests from your Vercel frontend:

1. Update `version1/backend/src/main.ts`:
   ```typescript
   app.enableCors({
     origin: [
       'http://localhost:5173', // Local development
       'https://expense-tracker-xyz.vercel.app', // Your Vercel URL
     ],
     credentials: true,
   });
   ```

2. Redeploy backend to Railway

---

## 🎉 Testing Your Live App

1. Go to your Vercel URL: `https://expense-tracker-xyz.vercel.app`
2. Click **"Sign Up"**
3. Create an account with:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test123@`
4. You should be redirected to Dashboard!
5. Logout and login again to test authentication

---

## 📊 Free Tier Limits

### Railway (Backend + Database)
- ✅ 500 hours/month (more than enough)
- ✅ 512 MB RAM
- ✅ 1 GB Disk
- ⚠️ Sleeps after 5 minutes of inactivity (wakes up on first request)
- Upgrade: $5/month for no sleep

### Vercel (Frontend)
- ✅ Unlimited bandwidth
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- 💯 **Completely free for personal projects!**

---

## 🔧 Common Issues

### Issue 1: "Cannot find module '/app/dist/main'" Error
**Problem**: Railway can't find the built application files

**Fix**: This happens when the TypeScript build doesn't run. We've added 3 files to fix this:
1. `railway.json` - Defines build and start commands
2. `nixpacks.toml` - Ensures all dependencies are installed
3. `.npmrc` - Prevents skipping devDependencies

**Verify the fix**:
1. Make sure these 3 files exist in your `backend/` folder
2. Commit and push them to GitHub:
   ```bash
   git add railway.json nixpacks.toml .npmrc
   git commit -m "Fix Railway deployment configuration"
   git push
   ```
3. Railway will auto-redeploy
4. Check logs - you should see "npm run build" executing

### Issue 2: Backend "Application failed to respond"
**Fix**: Check Railway logs (click service → Deployments → View Logs)
- Missing environment variables?
- Database migrations not run?
- Build command failing?

### Issue 3: Frontend can't connect to backend
**Fix**: Check CORS settings and `VITE_API_URL`
- Make sure backend allows your Vercel domain
- Check browser console for errors

### Issue 4: Database connection error
**Fix**: Check `DATABASE_URL` is correct
- Copy exact string from Railway PostgreSQL Variables
- Make sure it starts with `postgresql://`

---

## 🚀 Next Steps

1. ✅ Test all features (signup, login, expenses)
2. 🔒 Add email verification (SendGrid, Resend)
3. 📧 Set up password reset emails
4. 📈 Add analytics (PostHog, Plausible)
5. 🎨 Customize landing page
6. 🌐 Add custom domain (optional)

---

## 💡 Pro Tips

1. **Monitor your app**: Railway shows real-time logs
2. **Set up alerts**: Railway can email you if app crashes
3. **Use environment variables**: Never hardcode secrets
4. **Test before deploying**: Run `npm run build` locally first
5. **Git commit often**: Easy to rollback if needed

---

## 📱 Share Your App!

Your app is now live on the internet! Share the link:
```
https://expense-tracker-xyz.vercel.app
```

Anyone can sign up and use it! 🎉

---

Need help? Check the deployment logs or ask for help!
