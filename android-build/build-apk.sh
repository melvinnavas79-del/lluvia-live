#!/bin/bash
# ============================================
# LLUVIA LIVE - GENERAR APK ANDROID
# Ejecutar en computadora con Node.js y Java
# ============================================

echo "☔ Generando APK de Lluvia Live..."

# 1. Install bubblewrap
npm install -g @anthropic-ai/sdk 2>/dev/null
npm install -g @bubblewrap/cli

# 2. Init project
mkdir -p lluvia-apk && cd lluvia-apk

bubblewrap init --manifest="https://codigo-necesario.preview.emergentagent.com/manifest.json"

# During init it will ask:
# - Install JDK? -> Yes
# - Install Android SDK? -> Yes
# - Accept terms? -> Yes
# - Package name: com.lluvialive.app
# - App name: Lluvia Live
# - Keystore password: lluvialive123

# 3. Build APK
bubblewrap build

echo "✅ APK generado en: lluvia-apk/app-release-signed.apk"
echo "Sube este archivo a Google Play Console"
