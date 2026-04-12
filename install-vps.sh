#!/bin/bash
# ============================================
# LLUVIA LIVE - INSTALACIÓN AUTOMÁTICA VPS
# ============================================
# Uso: Pega este script completo en Termius
# Sistema: Ubuntu 20.04/22.04
# ============================================

echo "☔ ============================================"
echo "☔  INSTALANDO LLUVIA LIVE"
echo "☔  Esto toma aprox 5 minutos..."
echo "☔ ============================================"

# 1. ACTUALIZAR SISTEMA
echo "📦 Actualizando sistema..."
apt update -y && apt upgrade -y

# 2. INSTALAR DEPENDENCIAS
echo "📦 Instalando dependencias..."
apt install -y curl wget git nginx python3 python3-pip python3-venv nodejs npm certbot python3-certbot-nginx

# 3. INSTALAR MONGODB
echo "🗄️ Instalando MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update -y
apt install -y mongodb-org || {
    echo "⚠️ MongoDB repo failed, trying alternative..."
    apt install -y mongodb
}
systemctl start mongod || systemctl start mongodb
systemctl enable mongod || systemctl enable mongodb
echo "✅ MongoDB instalado"

# 4. INSTALAR PM2
echo "📦 Instalando PM2..."
npm install -g pm2 n
n stable
hash -r

# 5. CLONAR PROYECTO
echo "📥 Clonando Lluvia Live desde GitHub..."
cd /root
rm -rf lluvia-live
git clone https://github.com/melvinnavas79-del/lluvia-live.git
cd lluvia-live

# 6. CONFIGURAR BACKEND
echo "🔧 Configurando Backend..."
cd /root/lluvia-live/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn motor pymongo python-dotenv bcrypt pydantic python-multipart agora-token-builder python-jose requests

# Crear .env del backend
cat > /root/lluvia-live/backend/.env << 'ENVEOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=lluvia_live_db
CORS_ORIGINS=*
AGORA_APP_ID=Eccc145929e240a2b26f696a3a2ce542
AGORA_APP_CERTIFICATE=7cb80b931a4143f2aa4ef0eea6552ffe
ENVEOF

# Crear carpeta uploads
mkdir -p /root/lluvia-live/backend/uploads
chmod 777 /root/lluvia-live/backend/uploads

echo "✅ Backend configurado"

# 7. CONFIGURAR FRONTEND
echo "🔧 Configurando Frontend..."
cd /root/lluvia-live/frontend

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

# Crear .env del frontend
cat > /root/lluvia-live/frontend/.env << ENVEOF
REACT_APP_BACKEND_URL=http://${SERVER_IP}:8001
ENVEOF

npm install --legacy-peer-deps
npm run build

echo "✅ Frontend compilado"

# 8. CONFIGURAR NGINX
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/lluvia-live << NGINXEOF
server {
    listen 80;
    server_name ${SERVER_IP};

    # Frontend
    location / {
        root /root/lluvia-live/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 100M;
    }

    # Uploaded files
    location /api/uploads {
        alias /root/lluvia-live/backend/uploads;
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/lluvia-live /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configurado"

# 9. CONFIGURAR PM2 (BACKEND 24/7)
echo "🔄 Configurando PM2 para 24/7..."
cd /root/lluvia-live/backend

cat > /root/lluvia-live/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'lluvia-backend',
    cwd: '/root/lluvia-live/backend',
    script: 'venv/bin/uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8001',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      MONGO_URL: 'mongodb://localhost:27017',
      DB_NAME: 'lluvia_live_db',
      CORS_ORIGINS: '*',
      AGORA_APP_ID: 'Eccc145929e240a2b26f696a3a2ce542',
      AGORA_APP_CERTIFICATE: '7cb80b931a4143f2aa4ef0eea6552ffe'
    }
  }]
}
PM2EOF

pm2 start /root/lluvia-live/ecosystem.config.js
pm2 save
pm2 startup

echo "✅ PM2 configurado - App 24/7"

# 10. FIREWALL
echo "🔒 Configurando Firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 8001
ufw --force enable

echo "✅ Firewall configurado"

# 11. VERIFICACIÓN FINAL
echo ""
echo "☔ ============================================"
echo "☔  LLUVIA LIVE - INSTALACIÓN COMPLETADA"
echo "☔ ============================================"
echo ""
echo "🌐 Tu app está en: http://${SERVER_IP}"
echo ""
echo "📋 Servicios:"
echo "   ✅ MongoDB: $(systemctl is-active mongod || systemctl is-active mongodb)"
echo "   ✅ Nginx: $(systemctl is-active nginx)"
echo "   ✅ Backend: PM2 (lluvia-backend)"
echo ""
echo "📋 Comandos útiles:"
echo "   pm2 status          - Ver estado"
echo "   pm2 logs            - Ver logs"
echo "   pm2 restart all     - Reiniciar"
echo ""
echo "🔒 SEGURIDAD:"
echo "   ¡CAMBIA TU CONTRASEÑA AHORA!"
echo "   Ejecuta: passwd root"
echo ""
echo "☔ ¡LLUVIA LIVE ESTÁ EN LÍNEA! ☔"
echo "☔ Abre: http://${SERVER_IP}"
echo "============================================"
