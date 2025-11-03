document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const startServerBtn = document.getElementById('startServer');
    const stopServerBtn = document.getElementById('stopServer');
    const clearMessagesBtn = document.getElementById('clearMessages');

    const tcpCountEl = document.getElementById('tcpCount');
    const udpCountEl = document.getElementById('udpCount');
    const totalCountEl = document.getElementById('totalCount');

    const messageList = document.getElementById('messageList');
    const noMessages = document.getElementById('noMessages');
    const tabs = document.querySelectorAll('.tab');

    const debugInfo = document.getElementById('debugInfo');
    const debugToggle = document.getElementById('debugToggle');

    // --- URLS ---
    const managerUrl = 'py/server_manager.py';
    const websocketUrl = `ws://${window.location.hostname}:8082`;

    let debugMode = false;
    let ws;
    let counts = { tcp: 0, udp: 0, total: 0 };
    let currentFilter = 'all';

    // --- debug ---
    debugToggle.addEventListener('click', () => {
        debugMode = !debugMode;
        debugInfo.style.display = debugMode ? 'block' : 'none';
        debugToggle.textContent = debugMode ? 'Ocultar Informações de Depuração' : 'Exibir Informações de Depuração';
    });

    function logDebug(message) {
        if (!debugMode) return;
        const now = new Date().toISOString();
        debugInfo.innerHTML += `[${now}] ${message}\n`;
        debugInfo.scrollTop = debugInfo.scrollHeight;
        console.log(`[DEBUG] ${message}`);
    }

    // --- main ---
    function updateServerStatus(status, text) {
        logDebug(`Atualizando status: ${status} (${text})`);
        statusDot.className = 'status-dot';
        switch (status) {
            case 'online':
                statusDot.classList.add('status-online');
                break;
            case 'offline':
                statusDot.classList.add('status-offline');
                break;
            default: // starting, stopping, unknown
                statusDot.classList.add('status-offline');
                break;
        }
        statusText.textContent = text;
    }

    async function controlServer(action) {
        logDebug(`Solicitando ação do servidor: ${action}...`);
        
        let statusText = 'Verificando status...';
        if (action === 'start') statusText = 'Iniciando servidor...';
        if (action === 'stop') statusText = 'Parando servidor...';
        updateServerStatus(action, statusText);

        try {
            const response = await fetch(managerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: action }),
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            logDebug(`Resposta do gerenciador: ${JSON.stringify(data)}`);
            
            handleServerStatusResponse(data.status);

        } catch (error) {
            logDebug(`Erro ao controlar o servidor: ${error}`);
            updateServerStatus('offline', 'Erro ao contatar gerenciador');
        }
    }

    function handleServerStatusResponse(status) {
        if (status === 'running' || status === 'started') {
            updateServerStatus('online', 'Servidor online');
            connectWebSocket();
        } else if (status === 'stopped') {
            updateServerStatus('offline', 'Servidor offline');
            if (ws) ws.close();
        } else {
            updateServerStatus('unknown', `Status desconhecido: ${status}`);
        }
    }

    function connectWebSocket() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            logDebug('Conexão WebSocket já existe ou está conectando.');
            return;
        }

        logDebug(`Conectando ao WebSocket: ${websocketUrl}`);
        ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
            logDebug('WebSocket conectado');
            updateServerStatus('online', 'Servidor online (Conectado)');
        };

        ws.onclose = () => {
            logDebug('WebSocket desconectado');
            updateServerStatus('offline', 'Servidor online (Desconectado)');
        };

        ws.onerror = (error) => {
            logDebug(`Erro no WebSocket: ${error}`);
        };

        ws.onmessage = (event) => {
            logDebug(`Mensagem recebida: ${event.data}`);
            const data = JSON.parse(event.data);

            if (data.type === 'message') {
                addMessageToList(data.payload);
            } else if (data.type === 'stats') {
                updateStats(data.payload);
            }
        };
    }

    function addMessageToList(msg) {
        if (noMessages) {
            noMessages.style.display = 'none';
        }

        const msgEl = document.createElement('div');
        const proto = msg.protocol.toLowerCase();
        msgEl.className = `message ${proto}`;

        // aplicar filtro
        if (currentFilter !== 'all' && currentFilter !== proto) {
            msgEl.style.display = 'none';
        }

        const date = new Date(msg.timestamp);
        const timeStr = date.toLocaleTimeString('pt-BR');
        const dateStr = date.toLocaleDateString('pt-BR');

        msgEl.innerHTML = `
            <div class="message-header">
                <span class="protocol-badge ${proto}-badge">${msg.protocol}</span>
                <span>${msg.client_ip}</span>
                <span>${dateStr} ${timeStr}</span>
            </div>
            <div class="message-content">
                ${escapeHTML(msg.content)}
            </div>
        `;
        
        messageList.insertBefore(msgEl, messageList.firstChild);

        counts[proto]++;
        counts.total++;
        updateStatsUI();
    }

    function updateStatsUI() {
        tcpCountEl.textContent = counts.tcp;
        udpCountEl.textContent = counts.udp;
        totalCountEl.textContent = counts.total;
    }
    
    function updateStats(stats) {
        counts = stats;
        updateStatsUI();
    }

    function clearMessages() {
        logDebug('Limpando mensagens...');
        messageList.innerHTML = '';
        if (noMessages) {
            noMessages.style.display = 'block';
        }
        counts = { tcp: 0, udp: 0, total: 0 };
        updateStatsUI();
    }


    function filterMessages(filter) {
        currentFilter = filter;
        logDebug(`Filtrando por: ${filter}`);
        
        tabs.forEach(tab => {
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const messages = messageList.querySelectorAll('.message');
        messages.forEach(msg => {
            if (filter === 'all') {
                msg.style.display = 'block';
            } else if (msg.classList.contains(filter)) {
                msg.style.display = 'block';
            } else {
                msg.style.display = 'none';
            }
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    startServerBtn.addEventListener('click', () => controlServer('start'));
    stopServerBtn.addEventListener('click', () => controlServer('stop'));
    clearMessagesBtn.addEventListener('click', clearMessages);
    tabs.forEach(tab => {
        tab.addEventListener('click', () => filterMessages(tab.dataset.filter));
    });

    controlServer('status');
});
