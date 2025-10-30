# Mobile App - Quick Start Guide

## 🎯 Quick Start

### 1. Install & Run
```bash
cd mobile
npm install
npm start
```

### 2. Scan QR Code
- **Android**: Use Expo Go app
- **iOS**: Use Camera app or Expo Go

### 3. Test Login
Use these credentials to test:
```
Email: kima@web.de
Password: Passw0rd!
```

## ✅ Features to Test

### Authentication
- [x] Login with valid credentials
- [x] See error on invalid credentials
- [x] Token persists after app restart
- [x] Logout clears token

### Navigation
- [x] Bottom tabs work (Classes, Bookings, Trainers, Profile)
- [x] Can navigate between screens
- [x] Back navigation works

### Profile
- [x] User info displays correctly
- [x] Logout button works
- [x] Returns to login screen after logout

### Classes & Booking
- [x] Classes list loads
- [x] Can view class details
- [x] Can book a session
- [x] Booking appears in "My Bookings"

### My Bookings
- [x] Bookings list loads
- [x] Can cancel a booking
- [x] Cancelled booking disappears from list

## 🐛 Common Issues

### Issue: App won't load
**Solution**: 
```bash
npx expo start --clear
```

### Issue: Login button doesn't respond
**Solution**: Check terminal logs for API errors

### Issue: "Network request failed"
**Solution**: 
1. Check `.env` file has correct API_BASE_URL
2. Verify backend is running
3. Check device is on same WiFi

### Issue: White screen
**Solution**: Reload app (shake device → Reload)

## 📱 Testing Checklist

- [ ] Login works
- [ ] Navigation works
- [ ] Profile loads correctly
- [ ] Classes list loads
- [ ] Can book a class
- [ ] Booking appears in "My Bookings"
- [ ] Can cancel booking
- [ ] Logout works
- [ ] Token persists on app restart

## 🔍 Debug Tips

### View Console Logs
Look at the terminal where you ran `npm start` - all console.log() output appears there.

### Enable Remote Debugging
1. Shake device
2. Tap "Debug Remote JS"
3. Open browser DevTools

### Check API Calls
Watch terminal for:
```
apiPost URL: https://...
apiPost body: {...}
apiPost status: 200
apiPost parsed response: {...}
```

## 📊 Test Credentials

| Email | Password | Role | Business |
|-------|----------|------|----------|
| kima@web.de | Passw0rd! | admin | dd13e557-7278-480e-aa01-cb230b025870 |

## 🎉 Success Criteria

✅ App loads without errors  
✅ Can log in successfully  
✅ Navigation works smoothly  
✅ All screens display data  
✅ Can perform CRUD operations (book/cancel)  
✅ Logout and re-login works  

---

**All tests passing?** 🚀 You're ready to use the app!
