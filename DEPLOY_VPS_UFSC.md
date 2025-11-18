# 🚀 Guia de Deploy - VPS UFSC (HTTPS 24/7)

## ⚠️ REQUISITO OBRIGATÓRIO

**SEM DEPLOY VPS-UFSC HTTPS 24/7 = NOTA ZERO**

Este é o requisito mais crítico do projeto. A aplicação DEVE estar:
- ✅ Rodando em servidor UFSC
- ✅ Acessível via HTTPS (SSL válido)
- ✅ Disponível 24/7 (sem parar)
- ✅ Acessível externamente

---

## 📋 Pré-requisitos

1. **Acesso ao VPS-UFSC**
   - Solicitar acesso: https://ctic.ufsc.br
   - Aguardar aprovação (pode demorar dias)
   - Receber credenciais SSH

2. **Conhecimentos Necessários**
   - Linux básico (Ubuntu/Debian)
   - SSH
   - Nginx
   - Docker (opcional, mas recomendado)
   - Certificados SSL

---

## 🔧 Passo 1: Conectar ao VPS

### 1.1 SSH no Windows (PowerShell)

```powershell
# Conectar ao servidor UFSC
ssh usuario@vps-ufsc.inf.ufsc.br

# Ou com chave privada
ssh -i ~/.ssh/ufsc_key usuario@vps-ufsc.inf.ufsc.br
```

### 1.2 Verificar Sistema

```bash
# Ver distribuição Linux
cat /etc/os-release

# Ver recursos disponíveis
free -h
df -h
```

---

## 📦 Passo 2: Instalar Dependências

### 2.1 Atualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 2.2 Instalar Node.js (Frontend)

```bash
# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

### 2.3 Instalar Python (Backend)

```bash
# Instalar Python 3.11+
sudo apt install -y python3.11 python3.11-venv python3-pip

# Verificar
python3 --version
pip3 --version
```

### 2.4 Instalar MongoDB

```bash
# Importar chave pública
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Adicionar repositório
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar
sudo apt update
sudo apt install -y mongodb-org

# Iniciar serviço
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar
sudo systemctl status mongod
```

### 2.5 Instalar Nginx (Proxy Reverso)

```bash
sudo apt install -y nginx

# Iniciar
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.6 Instalar Certbot (SSL)

```bash
# Certbot para certificados Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
```

---

## 📂 Passo 3: Transferir Projeto

### 3.1 Via Git (Recomendado)

```bash
# Instalar git
sudo apt install -y git

# Clonar repositório
cd /var/www
sudo mkdir gomoku
sudo chown $USER:$USER gomoku
cd gomoku

git clone https://github.com/seu-usuario/gomoku.git .
```

### 3.2 Via SCP (Alternativa)

```powershell
# No Windows PowerShell (local)
scp -r C:\Users\Luan\Gomoku usuario@vps-ufsc.inf.ufsc.br:/var/www/gomoku
```

---

## 🔧 Passo 4: Configurar Backend

### 4.1 Criar Virtual Environment

```bash
cd /var/www/gomoku/backend

# Criar venv
python3 -m venv venv

# Ativar
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 4.2 Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano /var/www/gomoku/backend/.env
```

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=gomoku

# JWT
SECRET_KEY=sua_chave_super_secreta_aqui_minimo_32_caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App
ENVIRONMENT=production
ALLOWED_ORIGINS=https://seu-dominio.ufsc.br

# CORS
CORS_ORIGINS=["https://seu-dominio.ufsc.br"]
```

### 4.3 Criar Serviço Systemd (Backend)

```bash
sudo nano /etc/systemd/system/gomoku-backend.service
```

```ini
[Unit]
Description=Gomoku Backend API
After=network.target mongod.service

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/var/www/gomoku/backend
Environment="PATH=/var/www/gomoku/backend/venv/bin"
ExecStart=/var/www/gomoku/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar serviço
sudo systemctl daemon-reload
sudo systemctl start gomoku-backend
sudo systemctl enable gomoku-backend

# Verificar status
sudo systemctl status gomoku-backend

# Ver logs
sudo journalctl -u gomoku-backend -f
```

---

## 🎨 Passo 5: Configurar Frontend

### 5.1 Build do React

```bash
cd /var/www/gomoku/frontend

# Instalar dependências
npm install

# Criar build de produção
npm run build
```

### 5.2 Configurar Variáveis (se necessário)

```bash
# Criar .env.production
nano .env.production
```

```env
REACT_APP_API_URL=https://seu-dominio.ufsc.br/api
REACT_APP_WS_URL=wss://seu-dominio.ufsc.br/ws
```

```bash
# Rebuildar com novas variáveis
npm run build
```

---

## 🔒 Passo 6: Configurar Nginx + SSL

### 6.1 Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/gomoku
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.ufsc.br;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seu-dominio.ufsc.br;

    # SSL Certificates (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.ufsc.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.ufsc.br/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React Build)
    location / {
        root /var/www/gomoku/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache estático
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://150.162.244.21:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://150.162.244.21:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Max upload size
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/gomoku_access.log;
    error_log /var/log/nginx/gomoku_error.log;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/gomoku /etc/nginx/sites-enabled/

# Remover default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 6.2 Obter Certificado SSL

```bash
# Certbot automático (recomendado)
sudo certbot --nginx -d seu-dominio.ufsc.br

# Seguir instruções interativas:
# - Email de contato
# - Aceitar termos
# - Redirect HTTP → HTTPS: Sim

# Testar renovação automática
sudo certbot renew --dry-run
```

---

## ✅ Passo 7: Verificar Deployment

### 7.1 Testes Locais no Servidor

```bash
# Backend rodando?
curl http://150.162.244.21:8000/docs

# Nginx rodando?
sudo systemctl status nginx

# MongoDB rodando?
sudo systemctl status mongod
```

### 7.2 Testes Externos

```bash
# No seu computador local (Windows)
curl https://seu-dominio.ufsc.br

# Abrir no navegador
https://seu-dominio.ufsc.br
```

### 7.3 Verificar HTTPS

1. Abrir site no Firefox
2. Clicar no cadeado 🔒
3. Ver certificado válido
4. Verificar "Conexão segura"

### 7.4 Testar WebSocket

```javascript
// Console do navegador
const ws = new WebSocket('wss://seu-dominio.ufsc.br/ws/lobby');
ws.onopen = () => console.log('WebSocket conectado!');
ws.onerror = (e) => console.error('Erro:', e);
```

---

## 📊 Passo 8: Monitoramento

### 8.1 Ver Logs

```bash
# Backend
sudo journalctl -u gomoku-backend -f

# Nginx
sudo tail -f /var/log/nginx/gomoku_access.log
sudo tail -f /var/log/nginx/gomoku_error.log

# MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

### 8.2 Monitorar Recursos

```bash
# CPU e Memória
htop

# Processos Python
ps aux | grep uvicorn

# Conexões
sudo netstat -tulpn | grep LISTEN
```

---

## 🔄 Passo 9: Atualizar Projeto

### 9.1 Update via Git

```bash
cd /var/www/gomoku

# Pull changes
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gomoku-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

### 9.2 Rollback (se necessário)

```bash
# Ver commits
git log --oneline

# Voltar para commit anterior
git checkout [commit-hash]

# Rebuild
npm run build
sudo systemctl restart gomoku-backend
```

---

## 🐛 Troubleshooting

### Backend não inicia

```bash
# Ver erro detalhado
sudo journalctl -u gomoku-backend -n 50 --no-pager

# Testar manual
cd /var/www/gomoku/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend não carrega

```bash
# Verificar build existe
ls -la /var/www/gomoku/frontend/build

# Rebuild
cd /var/www/gomoku/frontend
rm -rf build node_modules
npm install
npm run build

# Verificar permissões
sudo chown -R www-data:www-data /var/www/gomoku/frontend/build
```

### SSL não funciona

```bash
# Renovar certificado
sudo certbot renew --force-renewal

# Verificar certificado
sudo certbot certificates

# Testar SSL
curl -I https://seu-dominio.ufsc.br
```

### WebSocket falha

```bash
# Verificar configuração Nginx
sudo nginx -t

# Ver logs WebSocket
sudo journalctl -u gomoku-backend | grep -i websocket

# Testar WebSocket local
wscat -c ws://150.162.244.21:8000/ws/lobby
```

---

## 📝 Checklist Final

- [ ] VPS-UFSC acessível via SSH
- [ ] Node.js, Python, MongoDB instalados
- [ ] Projeto clonado/transferido
- [ ] Backend rodando (systemd)
- [ ] Frontend buildado
- [ ] Nginx configurado
- [ ] SSL funcionando (HTTPS)
- [ ] Site acessível externamente
- [ ] WebSocket funcionando
- [ ] MongoDB persistindo dados
- [ ] Logs sendo gerados
- [ ] Serviços auto-start (systemd enable)
- [ ] URL documentada no LaTeX
- [ ] URL enviada na tarefa EP

---

## 🎯 Resultado Esperado

Após deployment completo:

✅ `https://seu-dominio.ufsc.br` → **Abre o jogo**  
✅ `https://seu-dominio.ufsc.br/api/docs` → **Swagger UI**  
✅ `wss://seu-dominio.ufsc.br/ws/lobby` → **WebSocket conecta**  
✅ Cadeado 🔒 verde no navegador  
✅ Disponível 24/7  
✅ Sobrevive a reboot do servidor

---

## 📞 Suporte CTIC-UFSC

- **Site**: https://ctic.ufsc.br
- **Email**: suporte@ctic.ufsc.br
- **Telefone**: (48) 3721-9999

**Tempo de resposta**: 1-3 dias úteis

---

## 🎓 Documentação Adicional

- [Nginx Docs](https://nginx.org/en/docs/)
- [Certbot](https://certbot.eff.org/)
- [MongoDB](https://docs.mongodb.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)

---

**Boa sorte com o deploy! 🚀**

Lembre-se: **SEM DEPLOY = NOTA ZERO**

É o requisito mais importante do projeto!