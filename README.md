# QueueR 💳

> **Skip the queue. Flash your QueueR.**

A mobile-first, Apple Wallet-styled payment QR code manager built with **Next.js (App Router, static export)**, **React**, **TypeScript**, and **Firebase (Auth + Offline-first Firestore)**, deployable directly to **Cloudflare Pages**.

---

## ✨ Key Features

- **Apple Wallet Card Deck**: Overlapping cards in brand colors, top-pinned 56px preview strips with provider name and masked number (`•••• 1234`), spring physics (`cubic-bezier(.32,1.2,.4,1)`), and tap-to-reorder deck interaction (`bringToFront`).
- **Circular Floating Add Button**: 56px bottom-right floating action button in `#007AFF` accent with smooth press states.
- **One-Tap Receive View**: Full-screen backdrop in brand color, crisp vector QR re-rendered on canvas with 2-module quiet zone, tap-to-reveal account number, and active **Screen Wake Lock**.
- **Brightness Hint & High-Contrast Scan Mode**: Auto-dismissing brightness suggestion (with "Don't show again" preference) and dedicated high-contrast Scan Mode (pure white canvas with enlarged QR).
- **Share as Image (1080x1350, 4:5)**: Generates high-res image posters entirely in-browser with brand gradient, logo/wordmark, rounded QR box, holder name, privacy-formatted number, and customizable footer line. Shares via native Web Share API with instant PNG download fallback.
- **Smart QR Pipeline**: Upload or paste screenshots; automatically decodes payload with `jsQR` (max 1200px downscale, `attemptBoth` inversion). Valid QR codes are stored purely as payload strings and rendered razor-sharp; non-decodable images fallback to high-quality JPEG data.
- **Instant Launch & Offline First**: Local cache opens your default card's QR instantly on launch, even before Firebase initializes. Works 100% offline via Firestore `persistentLocalCache` and Service Worker.
- **App Lock & Biometrics**:
  - 4-digit PIN hashed with **PBKDF2-SHA256 (310,000 iterations)**.
  - Biometric authentication via **WebAuthn Passkeys** (Touch ID, Face ID, Windows Hello).
  - Configurable auto-lock background timeout (`Immediately`, `30s`, `1m`, `5m`).
  - Lockout progression after 5 failed attempts (30s, 1m, 5m delays).
  - Content obfuscation on app-switcher backgrounding.
  - Optional "Blur numbers and QR until tapped" privacy mode.
- **Encrypted Backup & Restore (`.qrw`)**:
  - Full client-side encryption using **AES-GCM 256** and **PBKDF2-SHA256 (600,000 iterations)**.
  - Password strength meter (min 10 characters).
  - Encrypted envelope JSON format (`qr-wallet-backup-YYYY-MM-DD.qrw`).
  - Smart Import with **Merge** (automatic duplicate skipping by provider + number) or **Replace All**.
  - Last backup date display with 30-day gentle reminder.
- **Deploy Ready**: Zero server runtime requirements (`output: "export"`). Deploys seamlessly to Cloudflare Pages.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Static Export `output: "export"`)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with Apple Modern design tokens & spring curves
- **Backend / Database**: Firebase Web SDK v11 (Auth + Firestore Offline Persistence)
- **QR Engine**: `jsqr` (dynamic decoding) + `qrcode-generator` (sharp canvas rendering)
- **Security**: WebCrypto API (PBKDF2, AES-GCM 256, WebAuthn)
- **Validation**: Zod
- **Testing**: Vitest + Testing Library + jsdom (46 unit tests passing)

---

## 🔒 Security & Privacy Architecture

### 1. App Lock & PIN Protection
- **Zero Plaintext Storage**: The PIN is never written to disk or sent to any server. It is hashed locally using `PBKDF2` with `SHA-256`, a random 16-byte salt, and **310,000 iterations**.
- **Lockout Timing**: Failed PIN attempts are tracked in local storage. After 5 consecutive failures, the app enforces delay lockouts (5th failure: 30s; 6th failure: 1m; 7+ failures: 5m) with live countdown timers.
- **Forgot PIN Recovery**: If a user forgets their PIN, signing out and logging back in with their Firebase credentials safely resets the local app lock without bypassing authentication.

### 2. WebAuthn & Platform Biometrics
- QueueR uses native `PublicKeyCredential` for biometric unlocking.
- **iOS Home Screen Standalone PWA Note**: iOS WebKit supports WebAuthn inside standalone PWAs in iOS 16+. On older iOS releases or unsupported webviews, QueueR gracefully falls back to the master PIN.

### 3. Encrypted Backup File Specification (`.qrw`)
Encrypted backups are completely encrypted in the client's browser before download.
```json
{
  "app": "qr-wallet",
  "v": 1,
  "kdf": "PBKDF2-SHA256",
  "iterations": 600000,
  "salt": "<base64-16bytes>",
  "iv": "<base64-12bytes>",
  "data": "<base64-ciphertext>"
}
```
- **Key Derivation**: PBKDF2-SHA256 with 600,000 iterations.
- **Cipher**: AES-GCM 256-bit with authenticated integrity.
- **Zero Leakage**: Plaintext fields are cleared from memory, and the Service Worker explicitly bypasses caching on `.qrw` files.

---

## 🚀 Getting Started Locally

```bash
# 1. Clone repo & install dependencies
git clone <your-repo-url>
cd QReady
npm install

# 2. Configure Firebase in .env.local
cp .env.example .env.local

# 3. Run development server
npm run dev

# 4. Run automated test suite
npm test

# 5. Build static export
npm run build
```

---

## 📱 Testing Checklist

### 1. Floating Add Button
- [ ] Verify circular 56px button sits at bottom-right (`right: 20px, bottom: 20px + safe area`).
- [ ] Verify button smoothly scales (`scale(0.94)`) when tapped.
- [ ] Confirm button is hidden when Receive sheet, Editor sheet, Settings sheet, or Lock screen is active.
- [ ] Verify card stack bottom padding prevents button from overlapping card content.

### 2. Brightness Hint & Scan Mode
- [ ] Open Receive view: verify brightness banner appears at top and auto-hides after 4s.
- [ ] Tap "Don't show": confirm banner never appears again on subsequent opens.
- [ ] Tap "Scan Mode": verify background switches to high-contrast pure white and QR expands.
- [ ] Verify Wake Lock keeps the screen awake while viewing QR.

### 3. Share as Image (1080x1350)
- [ ] In Receive view, tap "Share image".
- [ ] Check modal preview: 1080x1350 canvas with brand gradient, wordmark / logo, rounded 48px QR box, holder name, and "Scan to pay" footer.
- [ ] Test number display toggles: "Last 4 digits", "Hidden", "Full number" (with safety prompt).
- [ ] Tap "Save Image" to download PNG or "Share" for native Web Share sheet.

### 4. App Lock
- [ ] In Settings > App Lock, configure a 4-digit PIN.
- [ ] Enable Biometrics (Touch ID / Face ID / Windows Hello).
- [ ] Test auto-lock timeout (`Immediate`, `30s`, `1m`, `5m`).
- [ ] Enter wrong PIN 5 times: verify lockout timer disables inputs for 30s.
- [ ] Enable "Blur Numbers & QR": confirm codes are blurred until tapped.

### 5. Encrypted Backup & Restore
- [ ] In Settings > Backup & Restore, tap "Export Backup".
- [ ] Enter passphrase (>= 10 chars) and observe strength meter.
- [ ] Download `.qrw` file and verify raw card data is not visible in plaintext.
- [ ] Test "Import Backup": enter wrong passphrase to test error handling, then correct passphrase.
- [ ] Test "Merge" vs "Replace All" options.
