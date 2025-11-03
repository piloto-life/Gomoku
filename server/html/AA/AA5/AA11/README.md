# Monitor de Mensagens TCP/UDP com WebSocket

Este repositório contém a implementação de um monitor de mensagens que recebe dados por sockets TCP (porta 8080) e UDP (porta 8081), e repassa em tempo real para uma interface web através de um servidor WebSocket (porta 8082).

Arquivos principais (dentro de `AA11`):

- `index.html` — interface web (usa `css/ws.css` e `js/ws.js`).
- `css/ws.css` — estilos para a interface.
- `js/ws.js` — lógica do frontend (conexão com `py/server_manager.py` e WebSocket).
- `py/combined_server.py` — servidor Python que implementa TCP/UDP/WS (asyncio + websockets).
- `py/server_manager.py` — gerenciador (CGI) para iniciar/parar/consultar o servidor (usado pela UI).
- `tcp_client.py`, `udp_client.py` — clientes de teste (enviam mensagens para as portas 8080/8081 usando o host extraído do URL informado).

Autores:

- Alec Coelho
- Luan Costa

---

## Requisitos

- Ubuntu 24.04 LTS (destinado ao VPS da disciplina), ou qualquer Linux com Python 3.11+
- Python 3.11+ (ou 3.8+) e pip
- Módulo Python: `websockets` (para o WebSocket server)
- Apache2 (se for expor via HTTP/CGI conforme enunciado)

## Instalação (servidor - VPS Ubuntu)

1. Atualize o sistema e instale o Python / Apache:

```bash
sudo apt update; sudo apt install -y python3 python3-venv python3-pip apache2
```

2. Instale a dependência Python (num ambiente virtual ou global):

```bash
sudo pip3 install websockets
```

3. Habilite o suporte a CGI no Apache e reinicie:

```bash
sudo a2enmod cgi
sudo systemctl restart apache2
```

4. Copie os arquivos para `/var/www/html/AA/AA11` (preserve a estrutura `css/`, `js/`, `py/`):

```bash
sudo mkdir -p /var/www/html/AA/AA11
sudo cp -r * /var/www/html/AA/AA11/
```

5. Torne os scripts Python executáveis (especialmente os CGI):

```bash
sudo chmod +x /var/www/html/AA/AA11/py/*.py
```

6. Verifique (e ajuste, se necessário) o caminho de `SERVER_SCRIPT_PATH` em `py/server_manager.py` para apontar para o `combined_server.py` instalado, por exemplo:

```py
SERVER_SCRIPT_PATH = "/var/www/html/AA/AA11/py/combined_server.py"
```

7. Configure o Apache (exemplo mínimo) adicionando em `/etc/apache2/sites-available/000-default.conf` dentro do `VirtualHost *:80`:

```apache
<Directory "/var/www/html">
    Options +ExecCGI
    DirectoryIndex index.html
    AddHandler cgi-script .py
    Require all granted
</Directory>
```

Reinicie o Apache:

```bash
sudo systemctl restart apache2
```

## Como funciona (visão geral)

- A UI (`index.html`) se comunica com o gerenciador `py/server_manager.py` via `fetch` (POST JSON). O gerenciador inicia ou para o `combined_server.py` escrevendo um PID em `/tmp/monitor_server_AA11.pid`.
- O `combined_server.py` abre três serviços:
  - TCP (porta 8080) — aceita conexões e lê mensagens, contando-as como `TCP`.
  - UDP (porta 8081) — recebe datagramas e responde, contando-as como `UDP`.
  - WebSocket (porta 8082) — serve clientes WebSocket (a UI) e faz broadcast das mensagens e estatísticas.

Ao receber mensagens TCP/UDP, o servidor cria um payload com `protocol`, `content`, `client_ip` e `timestamp` e envia via WebSocket para todas as UIs conectadas.

## Testes locais / uso dos clientes

Os clientes `tcp_client.py` e `udp_client.py` estão incluídos para testes. Exemplo de uso:

```bash
# enviar mensagem TCP (host extraído do URL)
python3 tcp_client.py http://pw.alec.coelho.vms.ufsc.br/AA/AA11 "Olá do TCP"

# enviar mensagem UDP
python3 udp_client.py http://pw.alec.coelho.vms.ufsc.br/AA/AA11 "Olá do UDP"
```

Os scripts também aceitam uma URL `ws://host:8082` ou `http://host/AA/AA11` — eles extraem o hostname e se conectam às portas 8080/8081 automaticamente.

Dica de teste rápido (sem Apache/CGI):

1. Abra um terminal no VPS e rode manualmente o servidor combinado:

```bash
python3 /var/www/html/AA/AA11/py/combined_server.py
```

2. No seu computador local (ou no VPS), execute o cliente TCP/UDP apontando para o host do servidor.
3. Abra a interface `http://<seu-host>/AA/AA11/` no navegador; se o WebSocket estiver ativo, a UI mostrará as mensagens.

## Observações sobre o gerenciador CGI

- `py/server_manager.py` foi escrito para ser usado como CGI (POST JSON). Ele usa um PID file (`/tmp/monitor_server_AA11.pid`) para controlar o processo do servidor. Em ambientes com `systemd` o ideal é criar um service unit em vez de usar CGI para controle de processos em produção.
- Em modo de desenvolvimento, é possível ignorar o gerenciador e iniciar `combined_server.py` manualmente.

## Desafio-bônus (WSS/HTTPS)

Para ativar WSS (WebSocket sobre TLS) você pode:

1. Gerar/instalar certificados (Let's Encrypt ou autoassinado).
2. Usar o Apache como proxy reverso (mod_proxy_wstunnel) apontando para o servidor WebSocket em `localhost:8082` e expor `wss://seu-dominio/`.

Exemplo de proxy (após habilitar `proxy` e `proxy_wstunnel`):

```apache
ProxyPass "/ws/"  "ws://127.0.0.1:8082/"
ProxyPassReverse "/ws/"  "ws://127.0.0.1:8082/"
```

Nesse caso, ajuste a UI (`js/ws.js`) para conectar em `wss://seu-dominio/ws/`.

## Solução de problemas

- Se a UI não conectar via WebSocket, verifique se o `combined_server.py` está rodando e se a porta 8082 está acessível no firewall.
- Se `py/server_manager.py` retornar erro ao iniciar o servidor, confirme que `SERVER_SCRIPT_PATH` aponta para o local correto e que os scripts têm permissão de execução.
- Se aparecer erro `ModuleNotFoundError: websockets`, instale o módulo com `pip3 install websockets`.

---

Autores: Alec Coelho, Luan Costa



