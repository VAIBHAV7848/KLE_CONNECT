# 🚀 QUICK FIX - Google Sign-In on Vercel

## ⚠️ IMMEDIATE ACTION REQUIRED

Your Google Sign-In is failing because of **TWO CRITICAL ISSUES**:

### 1. ✅ CSP Fixed (Already Done)
- Fixed `frame-src` in `index.html` to allow Firebase iframe
- Created `vercel.json` with proper headers

### 2. ⚠️ YOU MUST DO THIS NOW - Add Vercel Domain to Firebase

## 🔥 DO THIS RIGHT NOW (5 minutes):

### Step 1: Firebase Console - Add Authorized Domain
1. Open: https://console.firebase.google.com/project/kle-connect/authentication/settings
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Type: `kle-connect.vercel.app`
5. Click **Add**

### Step 2: Google Cloud Console - Add OAuth URLs
1. Open: https://console.cloud.google.com/apis/credentials?project=kle-connect
2. Find **Web client (auto created by Google Service)**
3. Click the pencil icon to edit
4. Under **Authorized JavaScript origins**, click **+ ADD URI**:
   - Add: `https://kle-connect.vercel.app`
5. Under **Authorized redirect URIs**, click **+ ADD URI**:
   - Add: `https://kle-connect.vercel.app/__/auth/handler`
6. Click **SAVE** at the bottom

### Step 3: Deploy to Vercel
```bash
git add .
git commit -m "Fix: Google Sign-In CSP and headers"
git push
```

Vercel will auto-deploy. Wait 1-2 minutes.

### Step 4: Test
1. Go to: https://kle-connect.vercel.app/#/auth
2. Click "Sign in with Google"
3. Should work instantly! ✅

## 📋 Complete Checklist

- [ ] Added `kle-connect.vercel.app` to Firebase Authorized domains
- [ ] Added `https://kle-connect.vercel.app` to OAuth JavaScript origins
- [ ] Added `https://kle-connect.vercel.app/__/auth/handler` to OAuth redirect URIs
- [ ] Pushed code changes to trigger Vercel deployment
- [ ] Tested Google Sign-In on Vercel URL

## 🐛 If Still Not Working

Check browser console (F12) for errors:
- `auth/unauthorized-domain` → Step 1 not done correctly
- `CSP violation` → Clear cache and hard reload (Ctrl+Shift+R)
- `popup-blocked` → Allow popups for kle-connect.vercel.app

## 📸 Screenshots to Help You

### Firebase Console - Where to Add Domain:
Look for "Authorized domains" section in Authentication → Settings

### Google Cloud Console - Where to Add URLs:
Look for "Authorized JavaScript origins" and "Authorized redirect URIs" sections

---

**Time to fix: 5 minutes**
**Difficulty: Easy - Just copy/paste the URLs**
