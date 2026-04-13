# Lluvia Live - PRD

## Problema Original
Aplicación social de audio streaming tipo "Lluvia Live" con salas de audio en vivo (Agora.io), gamificación, economía virtual, juegos y panel de control administrativo.

## Requisitos del Producto
- Audio Streaming Rooms via Agora.io (Mic/Speaker, auto-mute, sin duplicar asientos)
- Gamificación: Entradas VIP (Dragón, León, Tigre, etc.), Aristocracia, CP (Parejas), Clanes
- Economía: Coins, Diamonds, Stripe Payments, premios automáticos
- 6 Juegos: Ludo (pendiente webview), Ruleta, Dados, PPT, Carta Mayor, Trivia, Slots 777
- Multimedia: Upload Reels y Fotos
- Panel de Control: Editar precios, expandir micros (9 a 24), gestionar usuarios
- AI Admin Bot: Ejecutar acciones via lenguaje natural (Gemini)
- PWA, Android build script, iOS project setup, VPS install script
- Marca: "Lluvia Live" con ☔

## Arquitectura
- Frontend: React.js + TailwindCSS + Shadcn/UI
- Backend: FastAPI + Motor (Async MongoDB)
- DB: MongoDB
- Audio: Agora.io Web SDK
- AI: emergentintegrations (Gemini)
- Pagos: Stripe

## Lo Implementado
- [x] Full app frontend/backend desde cero
- [x] Agora.io Audio WebRTC
- [x] File Uploads (Reels y Photos)
- [x] Gamificación & Entradas VIP (Lottie)
- [x] Slots 777 & 5 mini-juegos
- [x] Panel de Control & Tienda Stripe
- [x] AI Admin Bot (Gemini)
- [x] PWA, iOS scaffold, Android build, VPS script
- [x] Clanes - Crear, unirse, salir, ranking (Frontend + Backend)
- [x] Parejas CP - Crear, ranking, nivel (Frontend + Backend)
- [x] Controles de audio movidos al fondo de la sala (fixed bottom)
- [x] Tarjetas de Clan y Pareja clickeables en Dashboard

## Backlog (P0/P1/P2)
- P0: Integrar juego Ludo como WebView/iframe
- P1: Push código a GitHub del usuario
- P2: Refactorizar server.py monolítico en módulos separados

## Credenciales
- Usuario: Melvin_Live / test123

## Archivos Clave
- `/app/backend/server.py` - Backend monolítico
- `/app/frontend/src/pages/RoomView.js` - Sala con audio controls al fondo
- `/app/frontend/src/pages/ClanesView.js` - Vista de Clanes
- `/app/frontend/src/pages/ParejasView.js` - Vista de Parejas
- `/app/frontend/src/pages/Dashboard.js` - Dashboard principal
- `/app/frontend/src/App.js` - Navegación
