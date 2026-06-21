# Dashboard Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Git installed on your computer

---

## STEP 1: Deploy Backend to Vercel

### 1.1 Create GitHub Repository for Backend

1. Go to https://github.com
2. Click "New Repository"
3. Repository name: `dashboard-backend`
4. Keep it Public or Private
5. Click "Create repository"

### 1.2 Push Backend to GitHub

Open terminal in backend folder and run:

```bash
cd C:\Users\ACER\Desktop\a\dashboard\backend

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend commit"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/dashboard-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 1.3 Deploy Backend on Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Select `dashboard-backend` repository
5. Configure Project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

6. **Add Environment Variables** (click "Environment Variables"):
   - Name: `PORT`
     Value: `5000`
   
   - Name: `MONGODB_URI`
     Value: `mongodb+srv://anil211508_db_user:basnet2059@cluster0.uoww5lr.mongodb.net/dashboard?retryWrites=true&w=majority&appName=Cluster0`

7. Click "Deploy"

8. **SAVE YOUR BACKEND URL!** It will be something like:
   ```
   https://dashboard-backend-xxxxx.vercel.app
   ```

---

## STEP 2: Update Frontend API URL

### 2.1 Update Frontend .env File

Open `C:\Users\ACER\Desktop\a\dashboard\frontend\.env`

Change from:
```
VITE_API_BASE=http://localhost:5000
```

To (replace with YOUR actual backend URL from Step 1.3):
```
VITE_API_BASE=https://dashboard-backend-xxxxx.vercel.app
```

### 2.2 Test Locally First

```bash
cd C:\Users\ACER\Desktop\a\dashboard\frontend
npm run dev
```

Open browser and test if everything works with the new backend URL.

---

## STEP 3: Deploy Frontend to Vercel

### 3.1 Create GitHub Repository for Frontend

1. Go to https://github.com
2. Click "New Repository"
3. Repository name: `dashboard-frontend`
4. Click "Create repository"

### 3.2 Push Frontend to GitHub

Open terminal in frontend folder:

```bash
cd C:\Users\ACER\Desktop\a\dashboard\frontend

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial frontend commit"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dashboard-frontend.git

# Push
git branch -M main
git push -u origin main
```

### 3.3 Deploy Frontend on Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Select `dashboard-frontend` repository
4. Configure Project:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Add Environment Variable**:
   - Name: `VITE_API_BASE`
     Value: `https://dashboard-backend-xxxxx.vercel.app` (your backend URL)

6. Click "Deploy"

7. **YOUR APP IS LIVE!** URL will be:
   ```
   https://dashboard-frontend-xxxxx.vercel.app
   ```

---

## STEP 4: Fix CORS (Important!)

Your backend needs to allow requests from your frontend domain.

### 4.1 Update Backend index.js

Find the CORS configuration in `backend/index.js` and update it:

```javascript
const cors = require('cors');

// Update CORS to allow your Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://dashboard-frontend-xxxxx.vercel.app',  // Add your actual frontend URL
    'https://*.vercel.app'  // Allow all Vercel preview deployments
  ],
  credentials: true
}));
```

### 4.2 Push Updated Backend

```bash
cd C:\Users\ACER\Desktop\a\dashboard\backend
git add .
git commit -m "Update CORS for Vercel frontend"
git push
```

Vercel will automatically redeploy your backend!

---

## STEP 5: Test Your Deployed App

1. Open your frontend URL: `https://dashboard-frontend-xxxxx.vercel.app`
2. Test all features:
   - Sales page
   - Purchases page
   - Customers page
   - Vendors page
   - Bank page
   - HR page
   - Payroll page
3. Check browser console for any errors

---

## Quick Reference URLs

After deployment, you'll have:

- **Frontend**: https://dashboard-frontend-xxxxx.vercel.app
- **Backend API**: https://dashboard-backend-xxxxx.vercel.app
- **MongoDB**: Already hosted on MongoDB Atlas

---

## Troubleshooting

### Issue: "Cannot connect to backend"
- Check backend URL in frontend `.env` is correct
- Verify backend is deployed and running on Vercel
- Check CORS configuration allows frontend domain

### Issue: "MongoDB connection failed"
- Verify `MONGODB_URI` environment variable on Vercel
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### Issue: "404 Not Found"
- Backend: Check `vercel.json` routes configuration
- Frontend: Check build was successful and `dist` folder was created

### Issue: "Environment variables not working"
- Vercel: Make sure you added them in project settings
- Frontend: Must start with `VITE_` prefix
- After adding/changing env vars, redeploy the project

---

## Updating Your App

### Update Backend:
```bash
cd backend
git add .
git commit -m "Your update message"
git push
```
Vercel auto-deploys!

### Update Frontend:
```bash
cd frontend
git add .
git commit -m "Your update message"
git push
```
Vercel auto-deploys!

---

## Custom Domain (Optional)

1. Go to Vercel project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Important Notes

- ✅ Backend `.env` file is NOT pushed to GitHub (protected by .gitignore)
- ✅ Environment variables are set directly on Vercel
- ✅ Both frontend and backend auto-deploy on every git push
- ✅ MongoDB is already cloud-hosted, no changes needed
- ✅ Print functionality will work on deployed version

---

## Need Help?

If you get errors during deployment:
1. Check Vercel deployment logs
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Make sure MongoDB Atlas allows all IP addresses

---

Your dashboard is now accessible from anywhere in the world! 🎉
