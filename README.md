# Memory Chats

Relive your exported WhatsApp conversations in a clean, familiar chat interface. Upload your `.txt` or `.zip` export and browse your messages exactly as they looked — privately, with everything staying on your device.

A private, offline-first React web app to view WhatsApp exported chats beautifully.

**100% private** — your files never leave your device/browser.

## Features
- ✅ Upload .zip (with media) or .txt chat exports
- ✅ **"Which one is me?" selector** — no more wrong sender detection
- ✅ **Chat persists on page refresh** (sessionStorage — clears when tab closes)
- ✅ Search messages with highlight
- ✅ Filter: All / Media / Mine / Theirs
- ✅ Image lightbox, video & audio playback
- ✅ Group chat support
- ✅ Stats bar (message counts per person)

---

## 🚀 Deploy FREE to Vercel (5 minutes)

### Step 1 — Push to GitHub
1. Go to https://github.com/new and create a new repo (e.g. `whatsapp-viewer`)
2. Upload all these files, or run:
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-viewer.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to https://vercel.com and sign up (free)
2. Click **"Add New Project"**
3. Import your GitHub repo
4. Framework: **Create React App** (auto-detected)
5. Click **Deploy** — done! You get a free URL like `https://whatsapp-viewer-xyz.vercel.app`

---

## 📱 Convert to Mobile App (React Native)

To publish on Play Store, rewrite using **React Native** or use **Capacitor** to wrap this web app:

### Option A — Capacitor (easiest, wraps this web app)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npm run build
npx cap add android
npx cap copy
npx cap open android
```
Then build APK in Android Studio → upload to Play Store.

### Option B — React Native (full native)
Use `react-native-document-picker` for file picking and `react-native-fs` for reading files.
Core parser logic in `src/utils/parser.js` is reusable as-is.

---

## 💰 Monetization Ideas
- Google AdMob ads (free tier) in the mobile app
- "Pro" version: export to PDF, search history, multiple chats stored
- Chrome Extension version

---

## Run locally
```bash
npm install
npm start
```
