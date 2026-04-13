# GUIA DE INSTALACION - LLUVIA LIVE

## Que necesitas

- Un VPS con Ubuntu 20.04, 22.04 o 24.04
- Minimo 2GB RAM, 20GB disco
- Acceso root (SSH o Termius)
- Proveedores recomendados: DigitalOcean, Vultr, Hetzner, Contabo

---

## PASO 1: Conectarte a tu servidor

Abre **Termius** (o cualquier terminal SSH) y conecta:

```
ssh root@TU_IP_DEL_SERVIDOR
```

---

## PASO 2: Instalar todo automaticamente

Copia y pega este comando en tu terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/melvinnavas79-del/lluvia-live/main/install-vps.sh | bash
```

O si prefieres hacerlo manual:

```bash
cd /root
git clone https://github.com/melvinnavas79-del/lluvia-live.git
cd lluvia-live
chmod +x install-vps.sh
sudo bash install-vps.sh
```

Espera 5-10 minutos. Al terminar veras la IP donde esta tu app.

---

## PASO 3: Configurar tus claves

Edita el archivo de configuracion del backend:

```bash
nano /root/lluvia-live/backend/.env
```

Cambia estas lineas con tus claves reales:

```
STRIPE_API_KEY=tu_clave_de_stripe_aqui
EMERGENT_LLM_KEY=tu_clave_emergent_aqui
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

Reinicia el backend:

```bash
pm2 restart lluvia-backend
```

---

## PASO 4: Abrir tu app

Abre el navegador y ve a:

```
http://TU_IP_DEL_SERVIDOR
```

Registrate con tu usuario y activa tu cuenta como Dueño:

```bash
# Desde la terminal del servidor, ejecuta esto
# (reemplaza TU_USER_ID con tu ID de usuario despues de registrarte)
curl -X POST "http://localhost:8001/api/admin/set-owner?user_id=TU_USER_ID&owner_key=lluvia_owner_melvin"
```

---

## AGREGAR DOMINIO PROPIO (Opcional)

Si tienes un dominio (ej: lluvialive.com):

### 1. Apunta el dominio a tu IP
En tu proveedor de dominio, crea un registro A:
- Tipo: A
- Nombre: @ (o tu subdominio)
- Valor: TU_IP_DEL_SERVIDOR

### 2. Configura Nginx
```bash
nano /etc/nginx/sites-available/lluvia-live
```
Cambia `server_name _;` por `server_name tudominio.com;`

### 3. Activa HTTPS gratis
```bash
sudo certbot --nginx -d tudominio.com
```

### 4. Actualiza el frontend
```bash
nano /root/lluvia-live/frontend/.env
```
Cambia a:
```
REACT_APP_BACKEND_URL=https://tudominio.com
```

### 5. Recompila
```bash
cd /root/lluvia-live/frontend
yarn build
systemctl restart nginx
```

---

## COMANDOS UTILES

| Comando | Que hace |
|---------|----------|
| `pm2 status` | Ver si el backend esta corriendo |
| `pm2 logs` | Ver logs en tiempo real |
| `pm2 restart all` | Reiniciar backend |
| `systemctl restart nginx` | Reiniciar servidor web |
| `systemctl status mongod` | Ver estado de la base de datos |

---

## ACTUALIZAR LA APP

Cuando haya cambios nuevos en GitHub:

```bash
cd /root/lluvia-live
git pull origin main
cd backend && source venv/bin/activate && pip install -r requirements.txt
cd ../frontend && yarn install --legacy-peer-deps && yarn build
pm2 restart lluvia-backend
systemctl restart nginx
```

---

## PROBLEMAS COMUNES

### La pagina no carga
```bash
pm2 logs lluvia-backend    # Ver errores del backend
systemctl status nginx      # Ver estado de nginx
```

### Error de MongoDB
```bash
systemctl restart mongod
```

### Error de permisos en uploads
```bash
chmod -R 755 /root/lluvia-live/backend/uploads
```

### El bot no responde
Verifica que EMERGENT_LLM_KEY este configurada en `/root/lluvia-live/backend/.env`

---

## DONDE OBTENER LAS CLAVES

- **EMERGENT_LLM_KEY**: Tu perfil en Emergent -> Universal Key
- **STRIPE_API_KEY**: https://dashboard.stripe.com/apikeys
- **AGORA**: Ya viene configurada. Si necesitas cambiarla: https://console.agora.io

---

Lluvia Live
