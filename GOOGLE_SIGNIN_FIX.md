# Google Sign-In Configuration Guide

## Problem
Google Sign-In is taking too long and showing error: "Firebase: Error (auth/popup-closed-by-user)"

## Root Causes
1. **Unauthorized domains** - Your domain is not whitelisted in Firebase Console
2. **OAuth consent screen issues** - Missing or incomplete configuration
3. **Slow network/CORS issues** - Firebase configuration problems

## Solutions Implemented in Code

### ✅ 1. Enhanced GoogleAuthProvider Configuration
- Added `prompt: 'select_account'` to force account selection
- Added `display: 'popup'` for better popup behavior
- Added scopes for profile and email

### ✅ 2. Improved Error Handling
- Added 60-second timeout detection
- Better error messages for different failure scenarios
- Console logging for debugging

### ✅ 3. Fixed Content Security Policy (CSP)
- **CRITICAL FIX**: Added `https://kle-connect.firebaseapp.com` to `frame-src` directive
- Added `https://*.firebaseapp.com` to allow Firebase authentication iframe
- Created `vercel.json` with proper headers for Vercel deployment

## Required Firebase Console Configuration

### **STEP 1: Add Authorized Domains** ⚠️ MOST IMPORTANT

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kle-connect**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** and add these domains:
   - `localhost` (for local development)
   - `kle-connect.vercel.app` ✅ **YOUR CURRENT DOMAIN**
   - `kle-connect.firebaseapp.com` (Firebase hosting)
   - `vaibhav7848.github.io` (GitHub Pages if using)
5. Click **Save**

**This is the #1 reason for "taking too long" errors!**

### **STEP 2: Configure OAuth Consent Screen**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **kle-connect**
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the following:
   - **App name**: KLE Connect
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - **Authorized domains**: Add your domain
   - **Scopes**: Add `email` and `profile`
5. Save and continue

### **STEP 3: Verify OAuth Client ID**

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Find your **Web client** (auto-created by Firebase)
3. Click to edit
4. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:5173
   https://kle-connect.vercel.app
   https://kle-connect.firebaseapp.com
   https://vaibhav7848.github.io
   ```
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5173/__/auth/handler
   https://kle-connect.vercel.app/__/auth/handler
   https://kle-connect.firebaseapp.com/__/auth/handler
   https://vaibhav7848.github.io/__/auth/handler
   ```
6. Click **Save**


### **STEP 4: Enable Google Sign-In in Firebase**

1. Back in Firebase Console
2. Go to **Authentication** → **Sign-in method**
3. Click on **Google**
4. Ensure it's **Enabled**
5. Verify the **Web SDK configuration** is present
6. Click **Save**

## Testing Steps

1. **Clear browser cache and cookies**
2. **Disable any popup blockers** for your domain
3. **Test in incognito mode** first
4. **Check browser console** for any error messages
5. **Verify internet connection** is stable

## Common Issues & Solutions

### Issue: "auth/unauthorized-domain"
**Solution**: Add your domain to Firebase Authorized domains (Step 1)

### Issue: "auth/popup-blocked"
**Solution**: 
- Allow popups in browser settings
- Add site to popup exception list
- Try in different browser

### Issue: Popup takes too long to load
**Solution**:
- Check internet connection
- Verify OAuth consent screen is published (not in testing mode)
- Clear browser cache
- Check if Google services are accessible in your region

### Issue: Popup closes immediately
**Solution**:
- Verify all redirect URIs are correctly configured
- Check browser console for CORS errors
- Ensure Firebase config is correct

## Development vs Production

### Development (localhost)
- Use `http://localhost:5173` or your dev port
- Add to authorized domains
- Test with incognito mode

### Production
- Use your actual domain (e.g., `https://kle-connect.web.app`)
- Ensure HTTPS is enabled
- Add production domain to all Firebase/Google Cloud settings

## Debugging Checklist

- [ ] Authorized domains added in Firebase Console
- [ ] OAuth consent screen configured in Google Cloud Console
- [ ] OAuth Client ID has correct origins and redirect URIs
- [ ] Google Sign-In is enabled in Firebase Authentication
- [ ] Browser allows popups for your domain
- [ ] Internet connection is stable
- [ ] Using HTTPS in production (not HTTP)
- [ ] Firebase config in code matches Firebase Console

## Quick Test

After configuring Firebase Console:

1. Open your app
2. Open browser DevTools (F12) → Console tab
3. Click "Sign in with Google"
4. Watch for any error messages in console
5. The popup should open within 2-3 seconds
6. Complete the sign-in process

If you see "Google Sign-In Error:" in console, check the specific error code to diagnose the issue.

## Need Help?

If issues persist:
1. Check browser console for specific error codes
2. Verify all Firebase Console settings match this guide
3. Try different browser or incognito mode
4. Check if Google services are accessible
5. Ensure you're using the latest Firebase SDK version
