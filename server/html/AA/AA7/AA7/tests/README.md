# Configuração dos Testes do Gomoku

## Visão Geral
Este diretório contém testes abrangentes para os três modos de partida do Gomoku:

### 🏠 PvP Local (`test_pvp_local.py`)
Testa o modo de 2 jogadores no mesmo dispositivo:
- ✅ Inicialização do jogo
- ✅ Movimentos alternados dos jogadores  
- ✅ Validação de movimentos inválidos
- ✅ Detecção de vitórias (horizontal, vertical, diagonal, anti-diagonal)
- ✅ Prevenção de falsos positivos
- ✅ Sequência completa de jogo

### 🤖 PvE (`test_pve.py`) 
Testa o modo jogador vs IA:
- ✅ Inicialização da IA (easy, medium, hard)
- ✅ Primeiro movimento da IA
- ✅ Resposta da IA ao jogador humano
- ✅ Estratégia defensiva (bloquear vitórias)
- ✅ Aproveitamento de oportunidades de vitória
- ✅ Diferenças entre dificuldades
- ✅ Partida PvE completa
- ✅ Performance da IA

### 🌐 PvP Online (`test_pvp_online.py`)
Testa o modo 2 jogadores via WebSocket:
- ✅ Conexão WebSocket básica
- ✅ Conexão WebSocket para jogos específicos
- ✅ Sistema de matchmaking
- ✅ Sincronização de movimentos
- ✅ Tratamento de conexões/desconexões
- ✅ Persistência do estado do jogo
- ✅ Jogos simultâneos

## Como Executar

### Executar Todos os Testes
```bash
cd tests
python run_all_tests.py
```

### Executar Testes Individuais
```bash
# PvP Local
python test_pvp_local.py

# PvE 
python test_pve.py

# PvP Online (requer backend rodando)
python test_pvp_online.py
```

## Pré-requisitos

### Para Testes Locais (PvP Local e PvE)
- Python 3.8+
- Módulos do backend do Gomoku

### Para Testes Online (PvP Online)
- Backend do Gomoku rodando (`docker compose up backend`)
- Biblioteca `websockets` (`pip install websockets`)
- Porta 9000 acessível

## Estrutura dos Testes

Cada arquivo de teste segue a estrutura:
1. **Setup**: Inicialização do ambiente de teste
2. **Testes Unitários**: Funcionalidades específicas
3. **Testes de Integração**: Fluxos completos
4. **Relatório**: Resumo dos resultados

## Interpretação dos Resultados

### ✅ Sucesso
- Funcionalidade testada funciona corretamente
- Sem erros ou exceções

### ⚠️ Aviso
- Funcionalidade funciona mas pode ter problemas menores
- Comportamento inesperado mas não crítico

### ❌ Falha
- Funcionalidade não funciona como esperado
- Erro crítico que precisa ser corrigido

## Dependências

Os testes tentam importar módulos do backend. Se não encontrados, usam implementações mock básicas para permitir testes parciais.

### Módulos Necessários
- `services.game_logic.GameLogic`
- `models.game.Position`, `PieceColor`
- `logic.game_logic.check_win`

### Dependências Externas
- `websockets` (apenas para testes online)
- `asyncio` (para testes assíncronos)

## Limitações

1. **Testes de IA**: Dependem da implementação real da IA no backend
2. **Testes WebSocket**: Requerem backend rodando e configurado
3. **Autenticação**: Usam tokens de teste (não tokens JWT reais)
4. **Rede**: Testes online assumem localhost:9000

## Troubleshooting

### Erro de Importação
```
ImportError: No module named 'services.game_logic'
```
**Solução**: Execute os testes do diretório raiz do projeto ou ajuste o PYTHONPATH

### Erro de Conexão WebSocket
```
ConnectionRefusedError: [Errno 111] Connection refused
```
**Solução**: Certifique-se que o backend está rodando (`docker compose up backend`)

### Timeout nos Testes
**Solução**: Aumente os timeouts nos testes ou verifique a performance do sistema

## Adicionando Novos Testes

Para adicionar um novo teste:
1. Crie um método começando com `test_`
2. Use `setup_method()` para inicialização
3. Inclua prints informativos para debugging
4. Faça assertions claras
5. Adicione o teste à lista em `run_tests()`

## Integração Contínua

Estes testes podem ser integrados em pipelines CI/CD:
- Execute `run_all_tests.py` 
- Verifique código de saída (0 = sucesso)
- Parse logs para relatórios detalhados
