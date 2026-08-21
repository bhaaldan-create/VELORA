# نشر الإنتاج ثم ربط التطبيق (HTTPS)

لا يمكن إكمال رفع المتاجر بدون نطاق HTTPS عام. بعد النشر نفّذي:

## 1) انشري الموقع

على Vercel (أو أي استضافة Node) انسخي من `.env.example` كل المتغيرات، وأهمها:

- `DATABASE_URL` = رابط Neon (نفس المستخدم حالياً)
- `ADMIN_*` و `CUSTOMER_SESSION_SECRET`
- مفاتيح WhatsApp / Stripe عند الحاجة

تأكدي أن الموقع يفتح على `https://YOUR-DOMAIN.com` وأن `/shop` يعرض المنتجات.

## 2) اربطي التطبيق بالإنتاج

على Windows من مجلد المشروع:

```powershell
powershell -File scripts/mobile-set-production-url.ps1 -Url https://YOUR-DOMAIN.com
```

هذا يحدّث `VELORA_MOBILE_URL` ويعيد `npm run mobile:sync`.

## 3) ابنِ المتاجر

- Android: Android Studio → Build → Generate Signed Bundle / APK  
  أو `cd android && .\gradlew bundleRelease`
- iOS (Mac): Xcode → Product → Archive

## ملاحظة

طالما `VELORA_MOBILE_URL` يشير لـ LAN (`http://192.168.x.x:3000`) فالتطبيق للتطوير فقط.
