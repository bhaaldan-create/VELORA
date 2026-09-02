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
| iOS signing | **Codemagic Managed Code Signing** (`environment.ios_signing`) |

التطبيق يفتح الموقع المنشور؛ `npm run build` يتحقق من سلامة المشروع لكن المحتوى يُحمّل من Vercel.

---

## 1) حساب Codemagic

1. [codemagic.io](https://codemagic.io) → تسجيل بحساب GitHub
2. **Add application** → اختري مستودع `VELORA`
3. **codemagic.yaml** في الجذر يُستخدم تلقائياً

---

## 2) App Store Connect API Key (Codemagic UI فقط)

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**
2. **+** → Key name: `Codemagic VELORA` → Access: **App Manager** → **Generate**
3. حمّلي `.p8` — **مرة واحدة فقط**

في Codemagic:

**Team settings** → **Integrations** → **Developer Portal** → **Manage keys**

- الاسم: **`Codemagic VELORA`** (يطابق `integrations.app_store_connect` في yaml)
- Issuer ID + Key ID + ملف `.p8` من **App Store Connect API**
- **لا** تستخدم مفتاح Sign in with Apple

**لا تضيفي** `CERTIFICATE_PRIVATE_KEY` أو `APP_STORE_CONNECT_*` إلى yaml أو Git — التكامل في UI كافٍ للـ Managed Signing.

---

## 3) iOS Code Signing Identities (Codemagic UI)

**Team settings** → **codemagic.yaml settings** → **Code signing identities**

### iOS certificates

- **Generate certificate** → **Apple Distribution**
- API key: **Codemagic VELORA**
- Reference name: **`velora-distribution`**

### iOS provisioning profiles

- **Fetch profiles** → App Store → **`beauty.velora.app`**
- Reference name: **`velora_app_store`**

---

## 4) `codemagic.yaml` — Managed Signing

```yaml
environment:
  groups:
    - velora
  ios_signing:
    distribution_type: app_store
    bundle_identifier: beauty.velora.app
    provisioning_profiles:
      - velora_app_store
    certificates:
      - velora-distribution
```

**لا** يوجد في workflow: `fetch-signing-files`، `keychain initialize`، `CERTIFICATE_PRIVATE_KEY`.

---

## 5) متغيرات البيئة (مجموعة `velora`)

| المتغير | مطلوب | ملاحظة |
|---------|--------|--------|
| `DATABASE_URL` | **نعم** | نفس Neon المستخدم في Vercel |
| `APP_STORE_APP_ID` | موصى به | الرقم من App Store Connect → App Information |

**تحذير:** `npm run build` يطبّق migrations على قاعدة الإنتاج إن كان `DATABASE_URL` يشير لها — نفس سلوك Vercel.

---

## 6) App Store Connect — التطبيق

إن لم يُنشأ بعد:

1. **Apps** → **+** → New App
2. Name: **VELORA Beauty**
3. Bundle ID: `beauty.velora.app`
4. SKU: `velora-beauty-001`
5. انسخي **Apple ID** (رقم) → `APP_STORE_APP_ID`

---

## 7) تشغيل Build

الـ workflow **لا يُشغّل تلقائياً** عند push — فقط عند tag `release/*`.

**Start new build:**

1. Workflow: **VELORA iOS → TestFlight**
2. Branch: **`cursor/ios-managed-code-signing`** (حتى يُدمج في `master`)
3. **Start build**

> إذا ظهرت خطوة **Verify Apple Developer Portal API access** أو **CERTIFICATE_PRIVATE_KEY**، فالبناء يعمل من فرع/`master` قديم — اختاري الفرع أعلاه.

---

## 8) ترتيب الخطوات في الـ pipeline

1. `npm ci`
2. `npm run build` (prisma + next build)
3. `npx cap sync ios`
4. Increment build number
5. `xcode-project use-profiles`
6. `xcode-project build-ipa`
7. رفع IPA إلى **TestFlight**

---

## 9) بعد نجاح الرفع

1. App Store Connect → **TestFlight** → انتظري معالجة البناء (15–45 دقيقة)
2. ثبّتي **TestFlight** على iPhone
3. جرّبي: Apple Sign-In، الطلبات، LARSA

---

## 10) أخطاء شائعة

| الخطأ | الحل |
|--------|------|
| `DATABASE_URL is not set` | أضيفي المتغير في مجموعة `velora` |
| `CERTIFICATE_PRIVATE_KEY is not set` | البناء من فرع قديم — استخدمي `cursor/ios-managed-code-signing` |
| `No matching profiles found` | تأكدي من `velora_app_store` + `velora-distribution` في Code signing identities |
| Scheme not found | تأكدي من `App.xcscheme` في `xcshareddata/xcschemes` |
| Integration name | طابق `app_store_connect: Codemagic VELORA` |

---

## أوامر المشروع (مرجع)

```bash
npm run build          # prisma generate && migrate deploy && next build
npm run mobile:sync    # npx cap sync
npm run mobile:ios     # npx cap open ios (Mac فقط)
```

راجع أيضاً: [`MOBILE.md`](../../MOBILE.md)، [`APP-STORE-APPLE.md`](APP-STORE-APPLE.md)
