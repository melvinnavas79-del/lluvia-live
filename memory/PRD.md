# Lluvia Live - PRD

## Problema Original
Aplicacion social de audio streaming "Lluvia Live" con salas de audio en vivo (Agora.io), gamificacion, economia virtual, juegos y panel de control administrativo.

## Requisitos del Producto
- Audio Streaming Rooms via Agora.io (Mic/Speaker, auto-mute, sin duplicar asientos)
- Gamificacion: Entradas VIP, Aristocracia, CP (Parejas), Clanes
- Economia: Coins, Diamonds, Stripe Payments, premios automaticos
- 6 Juegos: Ludo (pendiente webview), Ruleta, Dados, PPT, Carta Mayor, Trivia, Slots 777
- Multimedia: Upload Reels y Fotos
- Panel de Control: Editar precios, expandir micros (9 a 24), gestionar usuarios
- AI Admin Bot: Ejecutar acciones via lenguaje natural (Gemini)
- PWA, Android build script, iOS project setup, VPS install script
- Notificaciones: 4 categorias (Regalos Globales, Eventos CP, Alertas Conexion, Invitaciones)
- Flash Fame: Top 1 Individual, Clan Semanal, Clan Mensual, Pareja CP #1
- Fotos de Perfil: Upload de avatar propio
- Boton "Abrir Sala" directo y claro

## Arquitectura
- Frontend: React.js + TailwindCSS
- Backend: FastAPI + Motor (Async MongoDB)
- DB: MongoDB
- Audio: Agora.io Web SDK
- AI: emergentintegrations (Gemini)
- Pagos: Stripe

## Implementado
- [x] Full app frontend/backend
- [x] Agora.io Audio WebRTC
- [x] File Uploads (Reels y Photos)
- [x] Gamificacion & Entradas VIP (Lottie)
- [x] Slots 777 & 5 mini-juegos
- [x] Panel de Control & Tienda Stripe
- [x] AI Admin Bot (Gemini)
- [x] PWA, iOS scaffold, Android build, VPS script
- [x] Clanes - Crear, unirse, salir, ranking
- [x] Parejas CP - Crear, ranking, nivel
- [x] RoomView estabilizado (h-screen, overflow-hidden)
- [x] Controles de audio al fondo de la sala
- [x] Sistema de Notificaciones con 4 categorias con toggles
- [x] Campana con badge de no leidos en Dashboard
- [x] Flash Fame: Top 1 Individual, Clan Semanal, Clan Mensual, Pareja #1
- [x] Upload de foto de perfil (avatar personalizado)
- [x] Boton "Abrir Sala" en bottom nav y tab Mio
- [x] Perfil muestra clan, pareja, badges dinamicos

## Backlog
- P0: Integrar juego Ludo como WebView/iframe
- P1: Push codigo a GitHub
- P2: Refactorizar server.py monolitico

## Credenciales
- Usuario: Melvin_Live / test123
- Agora: eccc145929e240a2b26f696a3a2ce542

## Archivos Clave
- `/app/backend/server.py` - Backend monolitico
- `/app/frontend/src/pages/Dashboard.js` - Flash Fame + Abrir Sala
- `/app/frontend/src/pages/ProfileView.js` - Upload de avatar
- `/app/frontend/src/pages/RoomView.js` - Sala estabilizada
- `/app/frontend/src/pages/NotificationsView.js` - Notificaciones
- `/app/frontend/src/pages/ClanesView.js` - Clanes
- `/app/frontend/src/pages/ParejasView.js` - Parejas
