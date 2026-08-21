# دليل تطبيق VELORA (Android + iOS)

VELORA مبني على Next.js مع API وقاعدة بيانات، لذلك التطبيق **غلاف أصلي (Capacitor)** يفتح موقعك المنشور — وليس إعادة كتابة كاملة بـ React Native.

## المطلوب مسبقاً

| المنصة | الأدوات |
|--------|---------|
| Android | Android Studio + JDK 17 + جهاز/محاكي |
| iOS | جهاز Mac + Xcode + حساب Apple Developer |
| الاثنان | للتطوير: `npm run dev` على نفس الشبكة؛ للإنتاج: رابط HTTPS عام |

`appId`: `beauty.velora.app` — في `capacitor.config.ts`.

---

## 1) ربط رابط المتجر

في `.env.local`:

```env
# تطوير (نفس شبكة الواي فاي)
VELORA_MOBILE_URL=http://192.168.1.113:3000

# إنتاج (بعد نشر الموقع)
# VELORA_MOBILE_URL=https://YOUR-DOMAIN.com
```

ثم:

```bash
npm run dev
npm run mobile:sync
```

---

## 2) Android (Windows)

```bash
npm run mobile:sync
npm run mobile:android
```

في Android Studio: اختاري جهازاً أو محاكياً → **Run**.

- التطوير يستخدم HTTP؛ `usesCleartextTraffic` مفعّل في `AndroidManifest.xml`.
- إن ظهرت شاشة فارغة: افتحي `http://YOUR-LAN-IP:3000` من متصفح الهاتف أولاً.

### بناء للمتجر (Google Play)

**Build → Generate Signed Bundle / APK** أو:

```bash
cd android
.\gradlew bundleRelease
```

---

## 3) iOS (Mac فقط — لا يُبنى على Windows)

مشروع `ios/` جاهز ومزامن. على الـ Mac:

```bash
npm install
# إن نقص مجلد ios:
# npm run mobile:add:ios
npm run mobile:sync
npm run mobile:ios
```

في Xcode:

1. اختاري الهدف **App**
2. **Signing & Capabilities** → فريق Apple Developer
3. Run على جهاز أو محاكي

`Info.plist` يسمح بـ **NSAllowsLocalNetworking** للتطوير عبر HTTP على الشبكة المحلية.

للنشر: **Product → Archive** → App Store Connect.

### إن لم يتوفر Mac

استخدمي خدمة بناء macOS (مثل Codemagic / GitHub Actions على runner macOS) لبناء IPA من نفس المستودع.

---

## 4) الإنتاج (HTTPS قبل المتاجر)

1. انشري الموقع (مثلاً Vercel) مع نفس متغيرات `.env.example` وخاصة `DATABASE_URL` (Neon).
2. عيّني:
   ```env
   VELORA_MOBILE_URL=https://YOUR-DOMAIN.com
   ```
3. أعيدي المزامنة وابنِي:
   ```bash
   npm run mobile:sync
   npm run mobile:android
   # على Mac: npm run mobile:ios
   ```
4. ابنِ AAB / Archive للمتاجر.
5. إن توقف الموقع المنشور، يتوقف محتوى التطبيق.

---

## أوامر سريعة

```bash
npm run mobile:sync
npm run mobile:android
npm run mobile:ios
npm run mobile:add:android
npm run mobile:add:ios
```

راجع أيضاً:

- [`scripts/IOS-ON-MAC.md`](scripts/IOS-ON-MAC.md) — تشغيل iOS على Mac
- [`scripts/PRODUCTION-MOBILE.md`](scripts/PRODUCTION-MOBILE.md) — ربط HTTPS قبل المتاجر
- [`scripts/mobile-set-production-url.ps1`](scripts/mobile-set-production-url.ps1) — تحديث رابط الإنتاج ومزامنة Capacitor
- [`scripts/android-build-debug.ps1`](scripts/android-build-debug.ps1) — بناء APK للتطوير على Windows
