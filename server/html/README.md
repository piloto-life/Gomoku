# Gomoku - Projeto Web UFSC (AA4)

## 📋 Descrição

Esta é a versão atualizada do projeto Gomoku, desenvolvida conforme as instruções da atividade AA2 da disciplina INE5646 - Programação para Web da UFSC. 

O projeto implementa uma versão web completa do jogo Gomoku (Five in a Row) utilizando HTML5 semântico, CSS3 moderno e JavaScript vanilla.

## 🎯 Objetivos Atendidos

### ✅ Requisitos Obrigatórios Implementados:

1. **Codificação UTF-8**: Todos os arquivos utilizam codificação UTF-8
2. **Meta charset**: `<meta charset="UTF-8">` incluído
3. **Arquivo principal**: `index.html` como página principal
4. **CSS externo**: `style.css` vinculado via link
5. **Idioma**: Definido como Português Brasileiro (`lang="pt-BR"`)
6. **Título**: Título apropriado na aba do navegador
7. **Favicon**: `favicon.ico` incluído
8. **Header semântico**: `<header>` e `<nav>` implementados
9. **Navegação interna**: Links para seções da página
10. **Barra lateral**: `<aside>` com informações relevantes
11. **Rodapé**: `<footer>` com informações de contato usando `<address>`
12. **Segunda página**: `DOM.html` com árvore DOM
13. **Link para DOM**: Navegação para DOM.html
14. **Layout CSS**: Estilização completa e responsiva

### 📄 Conteúdo Implementado:

- **Sobre o Projeto**: Descrição completa do jogo e tecnologias
- **Objetivos**: Metas acadêmicas e técnicas
- **Disciplina**: Informações sobre INE5646
- **Links**: GitHub e UFSC
- **Jogo funcional**: Gomoku completamente jogável
- **Regras**: Como jogar
- **Estrutura DOM**: Página dedicada à análise da árvore DOM

## 🏗️ Estrutura de Arquivos

```
aa4/
├── index.html              # Página principal (renomeada de gomoku.html)
├── style.css              # Estilos (renomeado de gomoku.css)
├── gomoku.js              # Lógica do jogo JavaScript
├── DOM.html               # Página com árvore DOM
├── favicon.ico            # Ícone da aba
├── _SimpleWebServer.sh    # Script para servidor web
└── README.md              # Esta documentação
```

## 🚀 Como Executar

### Opção 1: Script Automático (Recomendado)
```bash
# Tornar executável (se necessário)
chmod +x _SimpleWebServer.sh

# Executar
./_SimpleWebServer.sh
```

### Opção 2: Servidor PHP Manual
```bash
# No diretório do projeto
php -S localhost:8080

# Abrir no navegador
firefox http://localhost:8080
```

### Opção 3: Servidor Python
```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

## 🎨 Características Implementadas

### HTML Semântico:
- `<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, `<article>`, `<footer>`, `<address>`
- Estrutura hierárquica clara
- Links de navegação interna
- Metadados completos

### CSS Moderno:
- Variáveis CSS (Custom Properties)
- Grid e Flexbox Layout
- Design responsivo (Mobile-first)
- Tema claro/escuro
- Animações e transições
- Paleta de cores profissional

### JavaScript Funcional:
- Lógica completa do jogo Gomoku
- Detecção de vitória em todas as direções
- Sistema de desfazer jogadas
- Cronômetro e histórico
- Interface responsiva
- Persistência de tema

### Acessibilidade:
- ARIA labels
- Navegação por teclado
- Contraste adequado
- Semântica clara
- Support para leitores de tela

## 🎮 Funcionalidades do Jogo

- **Tabuleiro 19x19**: Implementação tradicional do Gomoku
- **Dois jogadores**: Peças pretas e brancas
- **Detecção automática**: Vitória por 5 em linha
- **Sistema de desfazer**: Ctrl+Z ou botão
- **Novo jogo**: Ctrl+R ou botão
- **Cronômetro**: Tempo de partida
- **Histórico**: Últimos movimentos
- **Modal de resultado**: Feedback de fim de jogo

## 🔗 Links e Referências

- **UFSC**: [www.ufsc.br](https://www.ufsc.br)
- **GitHub**: [github.com/piloto-life/Gomoku](https://github.com/piloto-life/Gomoku)
- **Disciplina**: INE5646 - Programação para Web
- **Paleta de Cores**: Inspirada em colourlovers.com

## 👥 Informações Acadêmicas

- **Instituição**: Universidade Federal de Santa Catarina (UFSC)
- **Departamento**: Informática e Estatística (INE)
- **Disciplina**: INE5646 - Programação para Web
- **Atividade**: AA2 - Página Web Estática
- **Período**: 2025.1

## 📊 Estatísticas do Projeto

- **Elementos HTML**: 50+
- **Tags Semânticas**: 8 diferentes
- **Seções Principais**: 5
- **Arquivos**: 6 principais
- **Linhas de CSS**: 1000+
- **Linhas de JS**: 500+

---

**© 2025 UFSC - Desenvolvido para fins acadêmicos**
