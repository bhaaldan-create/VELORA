$env:JAVA_HOME = "$env:LOCALAPPDATA\Java\jdk-21"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
Set-Location (Join-Path $PSScriptRoot "..\android")
.\gradlew.bat assembleDebug
Write-Host "APK: app\build\outputs\apk\debug\app-debug.apk"
