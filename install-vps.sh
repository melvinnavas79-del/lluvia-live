#!/bin/bash
# ============================================
# LLUVIA LIVE - INSTALACION VPS
# ============================================
# Sistema: Ubuntu 20.04 / 22.04 / 24.04
# Uso: sudo bash install-vps.sh
# ============================================

set -e

echo ""
echo "============================================"
echo "  INSTALANDO LLUVIA LIVE"
echo "  Esto toma aprox 5-10 minutos..."
echo "============================================"
echo ""

# 1. ACTUALIZAR SISTEMA
echo "[1/10] Actualizando sistema..."
apt update -y && apt upgrade -y

# 2. INSTALAR DEPENDENCIAS BASE
echo "[2/10] Instalando dependencias..."
apt install -y curl wget git nginx python3 python3-pip python3-venv certbot python3-certbot-nginx ufw

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn pm2

# 3. INSTALAR MONGODB
echo "[3/10] Instalando MongoDB..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update -y
    apt install -y mongodb-org || apt install -y mongodb
fi
systemctl start mongod 2>/dev/null || systemctl start mongodb 2>/dev/null
systemctl enable mongod 2>/dev/null || systemctl enable mongodb 2>/dev/null
echo "MongoDB OK"

# 4. CLONAR PROYECTO
echo "[4/10] Clonando Lluvia Live..."
cd /root
rm -rf lluvia-live
git clone https://github.com/melvinnavas79-del/lluvia-live.git
cd lluvia-live

# 5. CONFIGURAR BACKEND
echo "[5/10] Configurando Backend..."
cd /root/lluvia-live/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Instalar dependencias del backend
pip install fastapi uvicorn motor pymongo python-dotenv bcrypt pydantic python-multipart python-jose requests agora-token-builder
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Crear carpeta uploads
mkdir -p /root/lluvia-live/backend/uploads
chmod 755 /root/lluvia-live/backend/uploads

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

# CONFIGURAR .env del backend
# IMPORTANTE: Edita este archivo con tus claves reales
cat > /root/lluvia-live/backend/.env << 'ENVEOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=lluvia_live_db
CORS_ORIGINS=*
AGORA_APP_ID=eccc145929e240a2b26f696a3a2ce542
AGORA_APP_CERTIFICATE=7cb80b931a4143f2aa4ef0eea6552ffe
STRIPE_API_KEY=TU_STRIPE_KEY_AQUI
EMERGENT_LLM_KEY=TU_EMERGENT_KEY_AQUI
ENVEOF

echo "Backend OK"

# 6. CONFIGURAR FRONTEND
echo "[6/10] Configurando Frontend..."
cd /root/lluvia-live/frontend

# .env del frontend - usar dominio o IP
cat > /root/lluvia-live/frontend/.env << ENVEOF
REACT_APP_BACKEND_URL=http://${SERVER_IP}
ENVEOF

yarn install --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps
yarn build 2>/dev/null || npm run build

echo "Frontend OK"

# 7. CONFIGURAR NGINX
echo "[7/10] Configurando Nginx..."
cat > /etc/nginx/sites-available/lluvia-live << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Frontend (React build)
    location / {
        root /root/lluvia-live/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100M;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Archivos subidos
    location /api/uploads {
        alias /root/lluvia-live/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/lluvia-live /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
systemctl enable nginx

echo "Nginx OK"

# 8. CONFIGURAR PM2
echo "[8/10] Configurando PM2 (backend 24/7)..."
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
    env_file: '/root/lluvia-live/backend/.env'
  }]
}
PM2EOF

cd /root/lluvia-live
pm2 delete lluvia-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "PM2 OK"

# 9. FIREWALL
echo "[9/10] Configurando Firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "Firewall OK"

# 10. CREAR USUARIO ADMIN
echo "[10/10] Verificando..."
sleep 3

echo ""
echo "============================================"
echo "  LLUVIA LIVE - INSTALACION COMPLETADA"
echo "============================================"
echo ""
echo "  Tu app esta en: http://${SERVER_IP}"
echo ""
echo "  Servicios:"
echo "    MongoDB: $(systemctl is-active mongod 2>/dev/null || systemctl is-active mongodb 2>/dev/null)"
echo "    Nginx:   $(systemctl is-active nginx)"
echo "    Backend: $(pm2 list | grep lluvia-backend | awk '{print $12}' || echo 'verificar')"
echo ""
echo "  IMPORTANTE - EDITA ESTAS CLAVES:"
echo "    nano /root/lluvia-live/backend/.env"
echo "    - STRIPE_API_KEY"
echo "    - EMERGENT_LLM_KEY"
echo "    Despues: pm2 restart lluvia-backend"
echo ""
echo "  PARA AGREGAR DOMINIO + HTTPS:"
echo "    1. Apunta tu dominio a IP: ${SERVER_IP}"
echo "    2. Edita: nano /etc/nginx/sites-available/lluvia-live"
echo "       Cambia 'server_name _' por 'server_name tudominio.com'"
echo "    3. sudo certbot --nginx -d tudominio.com"
echo "    4. Edita frontend .env:"
echo "       nano /root/lluvia-live/frontend/.env"
echo "       REACT_APP_BACKEND_URL=https://tudominio.com"
echo "    5. cd /root/lluvia-live/frontend && yarn build"
echo "    6. systemctl restart nginx"
echo ""
echo "  COMANDOS UTILES:"
echo "    pm2 status           - Ver estado"
echo "    pm2 logs             - Ver logs en vivo"
echo "    pm2 restart all      - Reiniciar backend"
echo "    systemctl restart nginx - Reiniciar nginx"
echo ""
echo "  LLUVIA LIVE ESTA EN LINEA"
echo "  Abre: http://${SERVER_IP}"
echo "============================================"
