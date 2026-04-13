# Lluvia Live - iOS Project

## Requisitos para compilar:
- Mac con macOS 13+
- Xcode 15+
- Cuenta Apple Developer ($99/año)
- CocoaPods instalado

## Pasos para compilar:

### 1. Abre Terminal en Mac y clona el repo:
```bash
git clone https://github.com/melvinnavas79-del/lluvia-live.git
cd lluvia-live/ios-project
```

### 2. Instala CocoaPods:
```bash
sudo gem install cocoapods
pod install
```

### 3. Abre en Xcode:
```bash
open LluviaLive.xcworkspace
```

### 4. Configura tu cuenta:
- En Xcode: Signing & Capabilities
- Selecciona tu equipo (Apple Developer account)
- Bundle ID: com.lluvialive.app

### 5. Compila:
- Selecciona tu iPhone o simulador
- Cmd + R para correr
- Product → Archive para crear IPA

### 6. Subir a App Store:
- Product → Archive → Distribute App → App Store Connect
