# Build Instructions - THARWA iOS App

## 📋 Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com
   - Enroll in Apple Developer Program

2. **Xcode** (Latest version)
   - Download from Mac App Store
   - Minimum version: 14.0+

3. **Node.js** (18+)
   - Download from: https://nodejs.org

4. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in all production values

## 🔧 Build Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Production Environment

Update `.env`:
```env
NODE_ENV=production
VITE_API_URL=https://your-production-api.com
# ... other production values
```

### Step 3: Build Frontend

```bash
npm run build
```

This creates:
- `dist/public/` - Client build files
- `dist/index.cjs` - Server build

### Step 4: Sync with Capacitor

```bash
npm run cap:sync
```

This:
- Copies `dist/public/` to `ios/App/App/public/`
- Updates Capacitor configuration
- Syncs native plugins

### Step 5: Open in Xcode

```bash
npm run cap:open:ios
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

## 🏗️ Xcode Configuration

### 1. Bundle Identifier

- Open project in Xcode
- Select project → Target "App"
- General → Bundle Identifier: `com.tharwa.app`
- Make sure it matches your App Store Connect app

### 2. Signing & Capabilities

- Select "App" target
- Signing & Capabilities tab
- Select your Team (Apple Developer account)
- Xcode will automatically manage signing

### 3. Version & Build

- General → Version: `1.0.0` (or your version)
- General → Build: `1` (increment for each build)

### 4. Info.plist

- Verify `ios/App/App/Info.plist` exists
- Check all permission descriptions are present:
  - NSLocationWhenInUseUsageDescription
  - NSPhotoLibraryUsageDescription
  - NSCameraUsageDescription
  - NSFaceIDUsageDescription
  - NSUserNotificationsUsageDescription

## 📦 Archive & Upload

### 1. Select Device

- In Xcode, select "Any iOS Device" or connected device
- **Do NOT** select simulator

### 2. Archive

- Product → Archive
- Wait for build to complete
- Xcode Organizer will open

### 3. Validate

- In Organizer, select your archive
- Click "Validate App"
- Fix any issues if found

### 4. Distribute

- Click "Distribute App"
- Select "App Store Connect"
- Follow the wizard
- Wait for upload to complete

## 🚀 App Store Connect

### 1. Create App

- Go to: https://appstoreconnect.apple.com
- My Apps → + → New App
- Fill in:
  - Name: THARWA
  - Primary Language: Arabic
  - Bundle ID: com.tharwa.app
  - SKU: tharwa-ios-001

### 2. App Information

- Subtitle: منصة الخدمات في الرياض
- Category: Business
- Age Rating: 4+

### 3. Pricing

- Price: Free
- Availability: All countries (or select)

### 4. App Description

- Copy from `APP_STORE_DESCRIPTION.md`
- Arabic description
- English description
- Keywords
- What's New

### 5. Screenshots

**Required sizes:**
- iPhone 6.7" (1290 x 2796): 3-10 screenshots
- iPhone 6.5" (1242 x 2688): 3-10 screenshots
- iPhone 5.5" (1242 x 2208): 3-10 screenshots

**How to take:**
1. Run app on device/simulator
2. Take screenshots of key screens:
   - Home screen
   - Task feed
   - Task details
   - Profile
   - Wallet
3. Save as PNG files
4. Upload to App Store Connect

### 6. App Icon

- Already in `ios-resources/AppIcon.appiconset/icon-1024.png`
- Xcode will automatically include it

### 7. URLs

- Privacy Policy: https://tharwwa.com/privacy.html
- Terms of Service: https://tharwwa.com/terms.html
- Support: https://tharwwa.com

### 8. Submit for Review

- After upload completes (may take 10-30 minutes)
- Go to App Store Connect → Your App
- Complete all required information
- Click "Submit for Review"
- Wait for review (usually 1-3 days)

## 🔍 Troubleshooting

### Build Fails

```bash
# Clean build
rm -rf dist ios/App/App/public
npm run build
npm run cap:sync
```

### Signing Issues

- Check Apple Developer account is active
- Verify Bundle ID matches App Store Connect
- Try "Automatically manage signing" in Xcode

### Upload Fails

- Check internet connection
- Verify all certificates are valid
- Try uploading again after a few minutes

### App Rejected

Common reasons:
- Missing Info.plist permissions
- Privacy Policy URL not accessible
- App crashes on launch
- Missing required information

## 📝 Checklist Before Submission

- [ ] All environment variables set in `.env`
- [ ] `NODE_ENV=production` in `.env`
- [ ] Build successful: `npm run build`
- [ ] Capacitor sync successful: `npm run cap:sync`
- [ ] Info.plist has all permissions
- [ ] Bundle ID matches App Store Connect
- [ ] Version and Build number set
- [ ] Archive created successfully
- [ ] App validated without errors
- [ ] Uploaded to App Store Connect
- [ ] All App Store metadata completed
- [ ] Screenshots uploaded
- [ ] Privacy Policy and Terms URLs working
- [ ] App tested on real device

## 🎯 Quick Commands

```bash
# Full build process
npm install
npm run build
npm run cap:sync
npm run cap:open:ios

# Then in Xcode:
# Product → Archive → Distribute → App Store Connect
```

## 📞 Support

If you encounter issues:
1. Check Xcode console for errors
2. Check server logs
3. Verify all environment variables
4. Review App Store Connect status

---

**Good luck with your App Store submission! 🚀**

