# Lluvia Live - PRD

## Problema Original
Aplicacion social de audio streaming "Lluvia Live" con salas de audio en vivo (Agora.io), gamificacion, economia virtual, juegos y panel de control administrativo.

## Requisitos del Producto
- Audio Streaming Rooms via Agora.io (Mic/Speaker, auto-mute, sin duplicar asientos)
- Gamificacion: Entradas VIP (Dragon, Leon, Tigre, etc.), Aristocracia, CP (Parejas), Clanes
- Economia: Coins, Diamonds, Stripe Payments, premios automaticos
- 6 Juegos: Ludo (pendiente webview), Ruleta, Dados, PPT, Carta Mayor, Trivia, Slots 777
- Multimedia: Upload Reels y Fotos
- Panel de Control: Editar precios, expandir micros (9 a 24), gestionar usuarios
- AI Admin Bot: Ejecutar acciones via lenguaje natural (Gemini)
- PWA, Android build script, iOS project setup, VPS install script
- Marca: "Lluvia Live"
- Notificaciones: 4 categorias (Regalos Globales, Eventos CP, Alertas Conexion, Invitaciones Estrategia)

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
- [x] Gamificacion & Entradas VIP (Lottie)
- [x] Slots 777 & 5 mini-juegos
- [x] Panel de Control & Tienda Stripe
- [x] AI Admin Bot (Gemini)
- [x] PWA, iOS scaffold, Android build, VPS script
- [x] Clanes - Crear, unirse, salir, ranking
- [x] Parejas CP - Crear, ranking, nivel
- [x] Controles de audio al fondo de la sala (fixed bottom)
- [x] Tarjetas de Clan y Pareja clickeables en Dashboard
- [x] RoomView estabilizado (h-screen, overflow-hidden, sin scroll de pagina)
- [x] Sistema de Notificaciones con 4 categorias:
  - Regalos Globales (ON/OFF) - dragones, fenix, etc
  - Eventos CP/Batallas (ON/OFF) - competencias en tiempo real
  - Alertas de Conexion (ON/OFF) - quien entro a la app
  - Invitaciones de Estrategia (AUTO) - "Fulano esta en live"
- [x] Campana con badge de no leidos en Dashboard

## Backlog (P0/P1/P2)
- P0: Integrar juego Ludo como WebView/iframe
- P1: Push codigo a GitHub del usuario
- P2: Refactorizar server.py monolitico en modulos separados

## Credenciales
- Usuario: Melvin_Live / test123

## Archivos Clave
- `/app/backend/server.py` - Backend monolitico
- `/app/frontend/src/pages/RoomView.js` - Sala estabilizada con audio controls
- `/app/frontend/src/pages/NotificationsView.js` - Sistema de notificaciones
- `/app/frontend/src/pages/ClanesView.js` - Vista de Clanes
- `/app/frontend/src/pages/ParejasView.js` - Vista de Parejas
- `/app/frontend/src/pages/Dashboard.js` - Dashboard con campana de notificaciones
- `/app/frontend/src/App.js` - Navegacion
