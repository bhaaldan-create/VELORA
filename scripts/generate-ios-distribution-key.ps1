# Generates RSA distribution private key for Codemagic CERTIFICATE_PRIVATE_KEY.
# Usage:
#   powershell -File scripts/generate-ios-distribution-key.ps1
#
# Copy the FULL file contents into Codemagic → group "velora" → CERTIFICATE_PRIVATE_KEY (Secret).
# Never commit this key to Git.

$ErrorActionPreference = "Stop"

$opensslCandidates = @(
  "${env:ProgramFiles}\Git\usr\bin\openssl.exe",
  "${env:ProgramFiles(x86)}\Git\usr\bin\openssl.exe",
  "openssl"
)

$openssl = $opensslCandidates | Where-Object { Test-Path $_ -ErrorAction SilentlyContinue } | Select-Object -First 1
if (-not $openssl) {
  $openssl = (Get-Command openssl -ErrorAction SilentlyContinue).Source
}
if (-not $openssl) {
  Write-Error "OpenSSL not found. Install Git for Windows or OpenSSL."
}

$outPath = Join-Path $env:TEMP "velora-ios-distribution-key.pem"
& $openssl genrsa -traditional -out $outPath 2048 | Out-Null

Write-Host ""
Write-Host "Generated: $outPath"
Write-Host ""
Write-Host "Next steps (Codemagic UI only — do NOT paste in Git):"
Write-Host "  1) Open the file above and copy ALL lines (BEGIN ... END)"
Write-Host "  2) Codemagic -> Environment variables -> group 'velora'"
Write-Host "  3) Name: CERTIFICATE_PRIVATE_KEY  |  Secret: ON"
Write-Host "  4) Paste the key and Save"
Write-Host "  5) Start new build on master"
Write-Host ""

notepad $outPath
