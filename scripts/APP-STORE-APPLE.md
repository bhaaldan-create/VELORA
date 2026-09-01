# VELORA — App Store Connect (Apple) — نسخ جاهز

**Bundle ID:** `beauty.velora.app`  
**اسم التطبيق:** VELORA Beauty  
**الموقع:** https://velorabeautyiq.me  
**المطوّر:** Mohammed AM Bahalddin A.S. (Individual — حتى 2027-08-31)

---

## 1) Apple Developer — App ID ✅ (من جهتك)

- App ID: `beauty.velora.app` + **Sign in with Apple**
- App Store Connect: **VELORA Beauty**

### Services ID (مطلوب لـ Apple Sign-In)

https://developer.apple.com/account/resources/identifiers/list/serviceId

1. **+** → **Services IDs**
2. Identifier → `APPLE_CLIENT_ID` (مثلاً `beauty.velora.app.web`)
3. **Sign in with Apple** → Configure:
   - Primary App ID: `beauty.velora.app`
   - Domain: `velorabeautyiq.me`
   - Return URL: `https://velorabeautyiq.me/api/auth/oauth/apple/callback`

### Key (.p8)

https://developer.apple.com/account/resources/authkeys/list

→ `APPLE_KEY_ID` + `APPLE_PRIVATE_KEY` + `APPLE_TEAM_ID`

> **مهم:** `APPLE_CLIENT_ID` = **Services ID** وليس Bundle ID.

---

## 2) Google Cloud OAuth

https://console.cloud.google.com/apis/credentials

Redirect URI: `https://velorabeautyiq.me/api/auth/oauth/google/callback`

---

## 3) Vercel env

```env
NEXT_PUBLIC_SITE_URL=https://velorabeautyiq.me
VELORA_MOBILE_URL=https://velorabeautyiq.me
CUSTOMER_SESSION_SECRET=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

---

## 4) iOS في المشروع ✅

| البند | الحالة |
|--------|--------|
| Bundle ID Debug/Release | `beauty.velora.app` |
| App.entitlements Sign in with Apple | ✅ |
| URL Scheme | `beauty.velora.app` |
| OAuth mobile (Browser bridge) | ✅ |

---

## 5) Build (Mac + Xcode)

```bash
export VELORA_MOBILE_URL=https://velorabeautyiq.me
npm run mobile:sync
npm run mobile:ios
```

Product → Archive → Upload (لا ترفع قبل اختبار TestFlight).

---

## Checklist

- [x] Bundle ID في Xcode
- [x] Sign in with Apple entitlement
- [ ] Services ID + Key (.p8)
- [ ] Google OAuth URIs
- [ ] Env على Vercel
- [ ] Privacy Policy `/privacy` يعمل
- [ ] Archive → TestFlight
- [ ] اختبار Google + Apple login
