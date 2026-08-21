# خطوات iOS على Mac (نسخ جاهز)

مشروع `ios/` مزامن مع:
- `server.url` من `VELORA_MOBILE_URL`
- `NSAllowsLocalNetworking` للتطوير عبر HTTP على الشبكة المحلية

## على جهاز Mac

```bash
cd /path/to/VELORA
echo 'VELORA_MOBILE_URL=http://YOUR-MAC-OR-PC-LAN-IP:3000' >> .env.local
npm install
chmod +x scripts/ios-open-on-mac.sh
npm run mobile:ios:mac
# أو:
# npm run mobile:sync && npm run mobile:ios
```

في Xcode:
1. Target **App** → Signing & Capabilities → Team
2. اختاري iPhone أو Simulator
3. Run (▶)

للإنتاج بعد HTTPS:
```bash
export VELORA_MOBILE_URL=https://YOUR-DOMAIN.com
npm run mobile:sync
# Product → Archive
```
