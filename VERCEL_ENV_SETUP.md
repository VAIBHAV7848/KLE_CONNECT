# 🔧 Environment Variables Setup for Vercel

## Current Status

✅ **Google Sign-In**: Working perfectly!
⚠️ **Video Calls & AI Tutor**: Need environment variables configured

## Console Warnings Explained

The warnings you're seeing are **harmless** and won't break your app:

1. ⚠️ **"Missing required environment variables"** - Optional features need configuration
2. ⚠️ **"Cross-Origin-Opener-Policy"** - Firebase internal warning, can be ignored
3. ⚠️ **CSP script-src violation** - Fixed in latest code

## Required Environment Variables

Your app needs these variables for full functionality:

### 1. VITE_AGORA_APP_ID ✅
- **Status**: Already configured in vercel.json
- **Value**: `bb21d68abe3449f9b90944ee33253fa5`
- **Purpose**: Video calling feature

### 2. VITE_TOKEN_SERVER_URL ⚠️
- **Status**: Needs to be set in Vercel dashboard
- **Value**: Your Render.com token server URL
- **Example**: `https://kle-token-server.onrender.com`
- **Purpose**: Generate Agora tokens for video calls

### 3. VITE_AI_API_URL ⚠️
- **Status**: Needs to be set in Vercel dashboard
- **Value**: Your Render.com AI API URL
- **Example**: `https://kle-token-server.onrender.com/api/ai`
- **Purpose**: AI Tutor feature

## How to Set Environment Variables on Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project: **kle-connect**
3. Click **Settings** → **Environment Variables**
4. Add these variables:

   **Variable 1:**
   - Name: `VITE_TOKEN_SERVER_URL`
   - Value: `https://your-render-url.onrender.com`
   - Environment: Production, Preview, Development (check all)
   - Click **Save**

   **Variable 2:**
   - Name: `VITE_AI_API_URL`
   - Value: `https://your-render-url.onrender.com/api/ai`
   - Environment: Production, Preview, Development (check all)
   - Click **Save**

5. **Redeploy** your app:
   - Go to **Deployments** tab
   - Click the three dots on latest deployment
   - Click **Redeploy**

### Option 2: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Link your project
vercel link

# Add environment variables
vercel env add VITE_TOKEN_SERVER_URL
# Enter your Render URL when prompted

vercel env add VITE_AI_API_URL
# Enter your Render AI API URL when prompted

# Redeploy
vercel --prod
```

## Do You Have a Render Server?

### If YES - You have deployed the token server:
1. Find your Render URL (e.g., `https://kle-token-server.onrender.com`)
2. Add it to Vercel environment variables as shown above
3. Redeploy

### If NO - You haven't deployed the token server yet:
You have two options:

#### Option A: Deploy Token Server to Render (Recommended)
1. Go to: https://render.com
2. Create new **Web Service**
3. Connect your GitHub repo: `VAIBHAV7848/KLE_CONNECT`
4. Use these settings:
   - **Root Directory**: `server` or `token-server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**:
     - `APP_ID`: `bb21d68abe3449f9b90944ee33253fa5`
     - `APP_CERTIFICATE`: Your Agora certificate
5. Deploy and copy the URL
6. Add URL to Vercel environment variables

#### Option B: Use Features Without Backend (Temporary)
If you don't need Video Calls or AI Tutor right now:
- The app will work fine without these variables
- You'll just see warnings in console (which you can ignore)
- Google Sign-In and other features work perfectly

## What Features Work Without Environment Variables?

### ✅ Works Without Config:
- Google Sign-In
- Email/Password Sign-In
- Dashboard
- Profile
- Study Materials
- Campus Map
- Most UI features

### ⚠️ Needs Config:
- Video Calls (Study Rooms)
- AI Tutor
- Screen Sharing in calls

## Clean Console (Remove Warnings)

The current warnings are **cosmetic only** and don't affect functionality. But if you want a clean console:

1. Set the environment variables in Vercel (as shown above)
2. Redeploy
3. Console will be clean ✅

## Quick Decision Guide

**Want to remove console warnings NOW?**
→ Set dummy values in Vercel:
- `VITE_TOKEN_SERVER_URL`: `https://placeholder.com`
- `VITE_AI_API_URL`: `https://placeholder.com/api`
- Video/AI features won't work, but warnings will disappear

**Want Video Calls & AI to work?**
→ Deploy token server to Render first, then add real URLs to Vercel

**Don't care about warnings?**
→ Do nothing! Your app works perfectly for authentication and most features

## Summary

Current state:
- ✅ Google Sign-In: **Working**
- ✅ Authentication: **Working**
- ✅ Dashboard: **Working**
- ⚠️ Console warnings: **Harmless, can be ignored**
- ⚠️ Video Calls: **Need server deployment**
- ⚠️ AI Tutor: **Need server deployment**

**Bottom line**: Your app is working! The warnings are just telling you that optional features need additional setup.
