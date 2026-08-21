#!/usr/bin/env bash
# شغّلي هذا السكربت على Mac بعد نسخ المشروع
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "هذا السكربت يعمل على macOS فقط."
  exit 1
fi

if [[ -z "${VELORA_MOBILE_URL:-}" ]]; then
  echo "عيّني VELORA_MOBILE_URL أولاً (مثال: http://192.168.x.x:3000 أو https://your-domain.com)"
  exit 1
fi

npm install
if [[ ! -d ios/App ]]; then
  npx cap add ios
fi
npx cap sync ios
npx cap open ios
echo "في Xcode: Signing & Capabilities → اختاري الفريق ثم Run."
