# Apple Sign-In — مفتاح خاص (لا يُرفع إلى Git)

1. انسخ ملف Apple `.p8` إلى هذا المجلد **محلياً فقط**:
   ```
   secrets/AuthKey_4T6DD5Q83S.p8
   ```

2. في `.env.local` (محلي):
   ```env
   APPLE_KEY_ID=4T6DD5Q83S
   APPLE_PRIVATE_KEY_PATH=./secrets/AuthKey_4T6DD5Q83S.p8
   APPLE_CLIENT_ID=beauty.velora.app.web
   APPLE_TEAM_ID=<Team ID من Apple Membership>
   ```

3. على **Vercel** (إنتاج): لا ترفع الملف. استخدم **Environment Variable**:
   - `APPLE_PRIVATE_KEY` = محتوى الملف (في لوحة Vercel فقط، ليس في الكود)
   - أو استخدم Vercel Secret Storage

**لا تضف `.p8` إلى Git.**
