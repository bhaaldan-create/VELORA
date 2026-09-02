# Codemagic — رفع VELORA iOS إلى TestFlight (بدون Mac)

هذا المستند يشرح إعداد Codemagic لمشروع **Capacitor** الموجود — لا React Native ولا إعادة بناء الواجهة.

## ما يفعله التطبيق

| البند | القيمة |
|--------|--------|
| Framework | Next.js (الموقع) + **Capacitor 8** (غلاف iOS) |
| Bundle ID | `beauty.velora.app` |
| Xcode project | `ios/App/App.xcodeproj` (لا `.xcworkspace`) |
| Xcode scheme | `App` |
| Capacitor `webDir` | `mobile-www` |
| الإنتاج | `VELORA_MOBILE_URL=https://velorabeautyiq.me` |
| iOS signing | SPM — **لا** CocoaPods / `pod install` |

التطبيق يفتح الموقع المنشور؛ `npm run build` يتحقق من سلامة المشروع لكن المحتوى يُحمّل من Vercel.

---

## 1) حساب Codemagic

1. [codemagic.io](https://codemagic.io) → تسجيل بحساب GitHub
2. **Add application** → اختري مستودع `VELORA`
3. **codemagic.yaml** في الجذر يُستخدم تلقائياً

---

## 2) App Store Connect API Key

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**
2. **+** → Key name: `Codemagic` → Access: **App Manager**
3. حمّلي `.p8` — **مرة واحدة فقط**

في Codemagic:

1. **Team settings** → **Integrations** → **App Store Connect**
2. أضيفي: Issuer ID، Key ID، `.p8`
3. احفظي **alias** التكامل (مثلاً `codemagic`)
4. في `codemagic.yaml` غيّري `integrations.app_store_connect` إن كان الاسم مختلفاً

---

## 3) iOS Code Signing في Codemagic

**Team settings** → **Integrations** → **Developer Portal** → **Manage keys**

- اسم التكامل: **`Codemagic VELORA`** (يجب أن يطابق `codemagic.yaml`)
- Issuer ID من **App Store Connect API** (UUID أعلى الصفحة — ليس Team ID فقط)
- Key ID + ملف `.p8` من **App Store Connect API** (Access: App Manager)
- **لا** تستخدم مفتاح Sign in with Apple (.p8) هنا

`codemagic.yaml` يستخدم أثناء البناء:

```bash
app-store-connect fetch-signing-files beauty.velora.app \
  --type IOS_APP_STORE \
  --certificate-key=@file:... \
  --create
```

---

## 4) متغيرات البيئة (Codemagic → Application → Environment variables)

| المتغير | مطلوب | ملاحظة |
|---------|--------|--------|
| `DATABASE_URL` | **نعم** | نفس Neon المستخدم في Vercel — `npm run build` يشغّل `prisma migrate deploy` |
| `CERTIFICATE_PRIVATE_KEY` | **نعم** | مفتاح RSA PEM كامل — انظر أدناه |
| `APP_STORE_APP_ID` | موصى به | الرقم من App Store Connect → App → App Information |
| `VELORA_MOBILE_URL` | مضبوط في yaml | `https://velorabeautyiq.me` |

### `CERTIFICATE_PRIVATE_KEY` (مرة واحدة)

من Windows في مجلد المشروع:

```powershell
powershell -File scripts/generate-ios-distribution-key.ps1
```

انسخي **كل** محتوى الملف (من `-----BEGIN RSA PRIVATE KEY-----` إلى `-----END RSA PRIVATE KEY-----`) إلى Codemagic → مجموعة **`velora`** → **Secret**.

**تحذير:** `npm run build` يطبّق migrations على قاعدة الإنتاج إن كان `DATABASE_URL` يشير لها — نفس سلوك Vercel.

---

## 5) App Store Connect — التطبيق

إن لم يُنشأ بعد:

1. **Apps** → **+** → New App
2. Name: **VELORA Beauty**
3. Bundle ID: `beauty.velora.app`
4. SKU: `velora-beauty-001`
5. انسخي **Apple ID** (رقم) → `APP_STORE_APP_ID`

---

## 6) تشغيل Build (يدوياً)

الـ workflow **لا يُشغّل تلقائياً** عند push إلى `master` — فقط عند tag `release/*`.

**للتجربة الأولى:**

1. Codemagic → التطبيق → **Start new build**
2. Workflow: **VELORA iOS → TestFlight**
3. Branch: `master`
4. **Start build**

أو ادفعي tag:

```bash
git tag release/1.0.0
git push origin release/1.0.0
```

---

## 7) ترتيب الخطوات في الـ pipeline

1. `npm ci`
2. `npm run build` (prisma + next build)
3. `npm run mobile:sync` مع `VELORA_MOBILE_URL`
4. `xcode-project use-profiles`
5. زيادة build number
6. `xcode-project build-ipa` على `ios/App/App.xcodeproj` / scheme `App`
7. رفع IPA إلى **TestFlight**

---

## 8) بعد نجاح الرفع

1. App Store Connect → **TestFlight** → انتظري معالجة البناء (15–45 دقيقة)
2. ثبّتي **TestFlight** على iPhone
3. جرّبي: Apple Sign-In، الطلبات، LARSA

---

## 9) أخطاء شائعة

| الخطأ | الحل |
|--------|------|
| `DATABASE_URL is not set` | أضيفي المتغير في Codemagic |
| Signing / provisioning | راجع Code signing identities لـ `beauty.velora.app` |
| Scheme not found | تأكدي من `App.xcscheme` في `xcshareddata/xcschemes` |
| Integration name | طابق `app_store_connect` alias في yaml |
| Privacy Policy | Apple ترفض بدون `https://velorabeautyiq.me/privacy` |

---

## أوامر المشروع (مرجع)

```bash
npm run build          # prisma generate && migrate deploy && next build
npm run mobile:sync    # npx cap sync
npm run mobile:ios     # npx cap open ios (Mac فقط)
```

راجع أيضاً: [`MOBILE.md`](../../MOBILE.md)، [`APP-STORE-APPLE.md`](APP-STORE-APPLE.md)
