# Deployment Guide - Online Exam Portal

This guide will help you deploy your MERN stack Online Exam Portal to:
- **Vercel** - Frontend (React/Vite)
- **Render** - Backend (Express/Node.js)
- **MongoDB Atlas** - Cloud Database

---

## 📋 Prerequisites

1. GitHub account with your project repository
2. Accounts on:
   - [Vercel](https://vercel.com) (free tier available)
   - [Render](https://render.com) (free tier available)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new organization (or use default)
4. Create a new project (or use default)

### 1.2 Create a Cluster
1. Click **"Build a Database"** or **"Create"** → **"Database"**
2. Choose **"M0 FREE"** (Free tier)
3. Select a cloud provider and region (choose closest to your users)
4. Click **"Create"**
5. Wait 3-5 minutes for cluster creation

### 1.3 Configure Database Access
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username and password (save these securely!)
5. Set privileges to **"Atlas admin"** (or "Read and write to any database")
6. Click **"Add User"**

### 1.4 Configure Network Access
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. For development: Click **"Add Current IP Address"**
4. For production: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ **Note**: For production, consider whitelisting only Render's IP ranges for better security
5. Click **"Confirm"**

### 1.5 Get Connection String
1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
6. Replace `<username>` and `<password>` with your database user credentials
7. Add your database name at the end: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/examportal?retryWrites=true&w=majority`
8. **Save this connection string** - you'll need it for Render!

---

## 🚀 Step 2: Deploy Backend to Render

### 2.1 Prepare Your Repository
1. Ensure your `server` folder is in the root of your GitHub repository
2. Ensure `server/package.json` has a `start` script (already present)
3. Commit and push all changes to GitHub

### 2.2 Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select your repository
5. Configure the service:
   - **Name**: `online-exam-portal-api` (or any name you prefer)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server` (important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click **"Advanced"** to add environment variables (see Step 2.3)
7. Click **"Create Web Service"**

### 2.3 Configure Environment Variables in Render
In the Render dashboard, go to your service → **"Environment"** tab → Add these variables:

```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/examportal?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
PORT=10000
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Important Notes:**
- Replace `MONGO_URI` with your MongoDB Atlas connection string from Step 1.5
- Replace `JWT_SECRET` with a long random string (e.g., use a password generator)
- `PORT` is usually auto-set by Render, but you can set it to `10000` (Render's default)
- Replace `FRONTEND_URL` with your Vercel deployment URL (you'll get this in Step 3)
  - Initially, you can set it to `http://localhost:5173` and update it after Vercel deployment

### 2.4 Wait for Deployment
1. Render will automatically start building and deploying
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://online-exam-portal-api.onrender.com`
4. **Save this URL** - you'll need it for Vercel!

### 2.5 Test Your Backend
1. Visit your Render service URL: `https://your-service.onrender.com`
2. You should see: `{"message":"API is running"}`
3. If you see this, your backend is working! ✅

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Your Repository
1. Ensure your `client` folder is in the root of your GitHub repository
2. Ensure `client/package.json` has a `build` script (already present)
3. Commit and push all changes to GitHub

### 3.2 Create Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` (click "Edit" and set to `client`)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### 3.3 Configure Environment Variables in Vercel
Before deploying, click **"Environment Variables"** and add:

```
VITE_API_BASE=https://your-render-service.onrender.com
```

**Important:**
- Replace `https://your-render-service.onrender.com` with your actual Render backend URL from Step 2.4
- Make sure there's **NO trailing slash** at the end

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-3 minutes)
3. Once deployed, you'll get a URL like: `https://your-project.vercel.app`
4. **Save this URL** - you need to update Render's FRONTEND_URL!

### 3.5 Update Render Environment Variable
1. Go back to Render dashboard
2. Navigate to your backend service → **"Environment"** tab
3. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy with the new CORS settings

---

## 🔄 Step 4: Update Frontend API Base URL (If Needed)

If you need to change the API URL later:

1. Go to Vercel Dashboard → Your Project → **"Settings"** → **"Environment Variables"**
2. Update `VITE_API_BASE` to your new backend URL
3. Click **"Save"**
4. Go to **"Deployments"** tab → Click **"..."** on the latest deployment → **"Redeploy"**

---

## 🗃️ Step 5: Seed Database (Optional)

If you want to populate your database with demo data:

### Option 1: Using Render Shell (Recommended)
1. Go to Render Dashboard → Your Backend Service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run seed
   ```
4. Wait for completion

### Option 2: Using Local Machine
1. Create a `.env` file in your `server` folder:
   ```
   MONGO_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-jwt-secret
   ```
2. Run:
   ```bash
   cd server
   npm run seed
   ```

---

## ✅ Step 6: Verify Everything Works

1. **Test Frontend**: Visit your Vercel URL
2. **Test Login**: Try logging in with demo credentials:
   - System Admin: `admin@example.com` / `Admin@123`
   - Exam Manager: `exam@example.com` / `Exam@123`
   - Question Manager: `question@example.com` / `Question@123`
   - Result Manager: `result@example.com` / `Result@123`
   - Student: `student1@example.com` / `Student@123`
3. **Test API**: Visit your Render URL - should show `{"message":"API is running"}`

---

## 🔧 Troubleshooting

### Backend Issues

#### "Cannot connect to MongoDB"
- ✅ Check MongoDB Atlas IP whitelist includes `0.0.0.0/0` or Render's IP
- ✅ Verify `MONGO_URI` in Render environment variables is correct
- ✅ Check MongoDB Atlas cluster is not paused
- ✅ Verify database user credentials are correct

#### "CORS Error" in Browser Console
- ✅ Verify `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash)
- ✅ Check browser console for the exact error message
- ✅ Ensure `credentials: true` is set in CORS config (already done)

#### "Application Error" on Render
- ✅ Check Render logs: Go to your service → **"Logs"** tab
- ✅ Verify all environment variables are set correctly
- ✅ Check `package.json` has correct `start` script
- ✅ Ensure `server.js` is in the root of the `server` folder

### Frontend Issues

#### "Failed to fetch" or Network Errors
- ✅ Verify `VITE_API_BASE` in Vercel environment variables matches your Render URL
- ✅ Check Render backend is running (visit Render URL directly)
- ✅ Ensure no trailing slash in `VITE_API_BASE`

#### "404 Not Found" for API calls
- ✅ Check API routes are correct (should start with `/api/...`)
- ✅ Verify `VITE_API_BASE` includes the full URL with `https://`

#### Build Fails on Vercel
- ✅ Check Vercel build logs for specific errors
- ✅ Verify `client/package.json` has all dependencies
- ✅ Ensure `client` folder is set as root directory in Vercel

### General Issues

#### Environment Variables Not Working
- ✅ After adding/updating environment variables, **redeploy** the service
- ✅ For Vercel: Go to Deployments → Redeploy
- ✅ For Render: Changes auto-trigger redeployment

#### Slow Response Times
- ✅ Render free tier has "spin down" - first request after inactivity may be slow
- ✅ Consider upgrading to paid tier for better performance
- ✅ MongoDB Atlas free tier has some limitations

---

## 📝 Environment Variables Summary

### Render (Backend) - Required:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/examportal?retryWrites=true&w=majority
JWT_SECRET=your-long-random-secret-key
FRONTEND_URL=https://your-vercel-app.vercel.app
PORT=10000
```

### Vercel (Frontend) - Required:
```
VITE_API_BASE=https://your-render-service.onrender.com
```

---

## 🔒 Security Best Practices

1. **JWT Secret**: Use a long, random string (at least 32 characters)
2. **MongoDB Password**: Use a strong password for database user
3. **IP Whitelist**: For production, consider whitelisting only Render's IP ranges instead of `0.0.0.0/0`
4. **Environment Variables**: Never commit `.env` files to GitHub
5. **HTTPS**: Both Vercel and Render provide HTTPS by default ✅

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 🎉 You're Done!

Your Online Exam Portal should now be live and accessible at your Vercel URL!

**Quick Links:**
- Frontend: `https://your-project.vercel.app`
- Backend API: `https://your-service.onrender.com`
- MongoDB Atlas: [cloud.mongodb.com](https://cloud.mongodb.com)

---

## 💡 Pro Tips

1. **Custom Domain**: You can add a custom domain in both Vercel and Render settings
2. **Monitoring**: Set up monitoring/alerting in Render for production
3. **Backups**: MongoDB Atlas provides automatic backups (check your plan)
4. **Performance**: Monitor your Render service - free tier has limitations
5. **Updates**: When you push to GitHub, both Vercel and Render auto-deploy!

---

**Need Help?** Check the troubleshooting section above or review the platform-specific documentation.
