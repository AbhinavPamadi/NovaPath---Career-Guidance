# Authentication Troubleshooting Guide

This guide helps debug authentication issues in the NovaPath application.

## Recent Fixes Applied

### 1. Cross-Origin Policy Configuration ✅
- Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` to Next.js headers
- Added `Cross-Origin-Embedder-Policy: unsafe-none` for compatibility
- This resolves popup window detection issues with Google OAuth

### 2. Enhanced Google Login Flow ✅
- **Immediate redirect**: Authentication success triggers immediate navigation without waiting for Firestore
- **Background Firestore operations**: User profile creation/update happens asynchronously
- **Timeout protection**: 30-second timeout prevents infinite loading states
- **Better error handling**: Specific error messages for different failure scenarios

### 3. Improved Error Handling ✅
- Popup-specific error messages (blocked, closed by user, network issues)
- Console logging for debugging authentication flow
- Graceful degradation when Firestore operations fail
- Enhanced authentication state management with error tracking

### 4. Firestore Utilities ✅
- Created `firestore-utils.ts` with retry logic and exponential backoff
- Separated concerns: authentication vs. profile management
- Background operations don't block user experience

## Testing the Fixes

### Test Google Login Flow:

1. **Open browser developer tools** (F12) and check Console tab
2. **Click Google login button**
3. **Look for these console messages**:
   ```
   Starting Google login...
   Google authentication successful: [user-id]
   User profile updated in Firestore
   ```

### Expected Behavior:

1. ✅ Google popup opens immediately
2. ✅ User authenticates in popup
3. ✅ Popup closes automatically
4. ✅ Page redirects to `/profile` immediately
5. ✅ User profile updates in background (check console)

## Debugging Steps

### If popup is blocked:
```javascript
// Check browser popup settings
// Error message: "Popup was blocked. Please allow popups for this site and try again."
```

### If authentication times out:
```javascript
// Check network connectivity
// Error message: "The login process took too long. Please try again."
```

### If Firestore writes fail:
```javascript
// Check browser console for warnings:
console.warn('Failed to update user profile in Firestore:', error);
// Note: This won't block the login flow anymore
```

### Manual Testing Commands:

```javascript
// Test Firebase Auth status
import { auth } from '@/lib/firebase';
console.log('Current user:', auth.currentUser);

// Test Firestore connection
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
const testDoc = await getDoc(doc(db, 'users', 'test'));
console.log('Firestore connection:', testDoc.exists());
```

## Browser Configuration

### For Development (localhost):
1. **Chrome**: Settings → Privacy and security → Site Settings → Pop-ups and redirects → Allow for localhost
2. **Firefox**: Options → Privacy & Security → Permissions → Block pop-up windows → Exceptions → Add localhost
3. **Safari**: Preferences → Websites → Pop-up Windows → Allow for localhost

### Firebase Console Verification:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `novapath2-27234`
3. **Authentication** → Sign-in method → Google → Ensure enabled
4. **Authentication** → Settings → Authorized domains → Ensure your domain is listed
5. **Firestore Database** → Check if rules allow authenticated writes

## Common Issues & Solutions

### Issue: "Login successful but page doesn't redirect"
**Solution**: Check browser console for JavaScript errors. The new implementation redirects immediately after authentication.

### Issue: "Firestore permission denied"
**Solution**: Check Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Issue: "Authentication state not updating"
**Solution**: The enhanced `use-auth.tsx` now includes timeout and error handling. Check console for auth state change messages.

### Issue: Cross-origin errors persist
**Solution**: Restart the development server after updating `next.config.ts`:
```bash
npm run dev
```

## Performance Monitoring

Add these console logs to monitor performance:

```javascript
// In your component
useEffect(() => {
  const start = Date.now();
  const checkAuth = () => {
    if (!loading) {
      console.log(`Auth state resolved in ${Date.now() - start}ms`);
    }
  };
  checkAuth();
}, [loading]);
```

## Support

If issues persist after applying these fixes:

1. **Check browser network tab** for failed requests
2. **Verify Firebase project configuration** in console
3. **Test in incognito mode** to rule out browser extensions
4. **Check firewall/antivirus** settings that might block popups
5. **Try different browsers** to isolate browser-specific issues

## Monitoring Authentication Health

The enhanced authentication system now includes:
- ⏱️ **Timeout detection**: Prevents infinite loading
- 🔄 **Retry mechanisms**: Automatic retries for Firestore operations
- 📊 **Detailed logging**: Console messages for debugging
- 🛡️ **Error isolation**: Firestore failures don't block authentication
- 🚀 **Performance**: Immediate redirects improve user experience
