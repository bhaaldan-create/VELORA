# يحدّث VELORA_MOBILE_URL لرابط الإنتاج HTTPS ثم يزامن Capacitor
# الاستخدام:
#   powershell -File scripts/mobile-set-production-url.ps1 -Url https://your-domain.com

param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if ($Url -notmatch '^https://') {
  Write-Error "رابط الإنتاج يجب أن يبدأ بـ https://"
}

function Set-EnvKey($path, $key, $value) {
  if (-not (Test-Path $path)) {
    Set-Content -Path $path -Value "$key=$value`n" -Encoding utf8
    return
  }
  $raw = Get-Content $path -Raw
  if ($raw -match "(?m)^$key=") {
    $raw = [regex]::Replace($raw, "(?m)^$key=.*$", "$key=$value")
  } else {
    if (-not $raw.EndsWith("`n")) { $raw += "`r`n" }
    $raw += "$key=$value`r`n"
  }
  Set-Content -Path $path -Value $raw -NoNewline -Encoding utf8
}

Set-EnvKey ".env.local" "VELORA_MOBILE_URL" $Url
if (Test-Path ".env") { Set-EnvKey ".env" "VELORA_MOBILE_URL" $Url }

Write-Host "VELORA_MOBILE_URL=$Url"
npm run mobile:sync
Write-Host "تمت المزامنة. ابنِ AAB من Android Studio أو Archive من Xcode."
