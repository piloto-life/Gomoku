# ✅ Checklist de Testes - Design System

## 🚀 Início Rápido

```bash
cd frontend
npm start
```

---

## 📱 1. MOBILE (375px - iPhone SE)

### Login Page
- [ ] Form centralizado e responsivo
- [ ] Inputs grandes e clicáveis
- [ ] Botão de senha (mostrar/ocultar) funciona
- [ ] Submit button com gradiente
- [ ] Link "Criar conta" clicável

### Home Page  
- [ ] Hero section visível
- [ ] Logo grande (⚫⚪) animado
- [ ] CTAs empilhados verticalmente
- [ ] Features em coluna única
- [ ] Stats 2 colunas

### Lobby
- [ ] Header compacto
- [ ] Tabs com scroll horizontal
- [ ] Game cards em coluna única (1 por linha)
- [ ] Botões grandes e clicáveis
- [ ] Fila de matchmaking responsiva

### Game
- [ ] **TESTE PRINCIPAL**: Células 15px visíveis
- [ ] Tabuleiro cabe na tela (285px total)
- [ ] Indicador de turno no topo
- [ ] Sidebar abaixo do tabuleiro
- [ ] Chat colapsado ou minimizado
- [ ] Hover preview funciona
- [ ] **VITÓRIA**: Modal com 🎉 (não erro!)

### Profile
- [ ] Avatar centralizado
- [ ] Stats em 2 colunas
- [ ] Game history empilhada
- [ ] Badges coloridos visíveis

---

## 📲 2. TABLET (768px - iPad)

### Layout Geral
- [ ] Header com navegação completa
- [ ] Conteúdo centralizado (max-width)
- [ ] Grids em 2 colunas

### Game Page
- [ ] **Células 18px**
- [ ] Layout: [Tabuleiro] [Sidebar]
- [ ] Chat lateral visível
- [ ] Player info lado a lado

### Lobby
- [ ] Game cards 2 colunas
- [ ] Mode selector 2 colunas
- [ ] Tabs horizontais (sem scroll)

---

## 🖥️ 3. DESKTOP (1920px)

### Layout Completo
- [ ] Header com todos elementos
- [ ] Conteúdo max-width 1400px
- [ ] Navegação horizontal

### Game Page
- [ ] **Células 20px**
- [ ] Layout 3 colunas: [Info] [Board] [Chat]
- [ ] Tudo visível sem scroll
- [ ] Hover effects funcionando

### Lobby
- [ ] Game cards 3 colunas
- [ ] Mode selector 3 colunas
- [ ] Players list lateral
- [ ] Tudo visível sem scroll

---

## 🎮 4. TESTES FUNCIONAIS

### Modal de Vitória (CRÍTICO!)
1. Criar jogo PvP Local
2. Fazer 5 jogadas na diagonal/linha/coluna
3. Ganhar o jogo

**✅ DEVE MOSTRAR:**
```
🎉
Game Over! [jogador] wins!
Partida finalizada com sucesso!
[Botão: Voltar ao Lobby]
```

**❌ NÃO DEVE MOSTRAR:**
```
⚠️ Erro: Game Over! player wins!
```

### Indicador de Turno
- [ ] Verde quando é seu turno
- [ ] Laranja quando é turno do oponente
- [ ] Animação pulse quando ativo
- [ ] Texto "✓ Seu turno" ou "⏳ Aguardando"

### Hover Preview
- [ ] Círculo verde semi-transparente aparece
- [ ] Célula aumenta (scale 1.1x)
- [ ] Glow verde ao redor
- [ ] Cursor pointer

### Formulários
- [ ] Focus: borda azul + shadow
- [ ] Erro: shake animation + texto vermelho
- [ ] Submit: loading spinner
- [ ] Disabled: opacity reduzida

---

## 🎨 5. TESTES VISUAIS

### Cores
- [ ] Primary: Roxo (#667eea)
- [ ] Success: Verde (#48bb78)
- [ ] Danger: Vermelho (#f56565)
- [ ] Gradientes suaves

### Animações
- [ ] Buttons: ripple effect ao clicar
- [ ] Cards: elevação ao hover
- [ ] Modal: fadeIn + scaleIn
- [ ] Loading: spinner rotativo

### Sombras
- [ ] Cards: sombra sutil
- [ ] Hover: sombra aumenta
- [ ] Modal: sombra forte
- [ ] Game board: sombra decorativa

### Bordas
- [ ] Radius consistente (8-16px)
- [ ] Inputs: border animado
- [ ] Cards: border transparente → colorido

---

## 🌗 6. DARK MODE (Opcional)

Se implementado `data-theme="dark"`:
- [ ] Background escuro (#1a202c)
- [ ] Texto claro (#f7fafc)
- [ ] Cores ajustadas
- [ ] Contraste mantido

---

## ♿ 7. ACESSIBILIDADE

### Keyboard Navigation
- [ ] Tab entre elementos
- [ ] Enter em botões
- [ ] Escape fecha modals
- [ ] Focus visible (outline azul)

### Touch Targets
- [ ] Botões ≥ 44x44px
- [ ] Células clicáveis facilmente
- [ ] Links espaçados
- [ ] Sem toque acidental

### Legibilidade
- [ ] Texto ≥ 16px base
- [ ] Contraste adequado
- [ ] Fonte legível
- [ ] Line-height 1.6

---

## 🐛 8. BUGS CONHECIDOS CORRIGIDOS

- [x] ~~Vitória aparece como erro~~ → CORRIGIDO
- [x] ~~Tabuleiro quebra em mobile~~ → CORRIGIDO
- [x] ~~Sem indicador de turno~~ → CORRIGIDO
- [x] ~~Forms genéricos~~ → CORRIGIDO
- [x] ~~Sem responsividade~~ → CORRIGIDO

---

## 📊 9. PERFORMANCE

### Network Tab (DevTools)
- [ ] CSS carrega rápido (< 100KB)
- [ ] Sem arquivos duplicados
- [ ] Fontes otimizadas

### Performance Tab
- [ ] FPS consistente (60fps)
- [ ] Sem layout shifts
- [ ] Animações suaves
- [ ] First Paint < 1.5s

---

## ✨ 10. CHECKLIST FINAL

### Antes de Deploy
- [ ] Todos testes mobile passaram
- [ ] Todos testes tablet passaram
- [ ] Todos testes desktop passaram
- [ ] Modal de vitória funciona
- [ ] Sem erros no console
- [ ] CSS importado corretamente
- [ ] Animações suaves
- [ ] Performance aceitável

### Documentação
- [ ] DESIGN_SYSTEM_OVERHAUL.md lido
- [ ] DESIGN_IMPLEMENTATION_SUMMARY.md lido
- [ ] Entendido estrutura de arquivos
- [ ] Sabe onde modificar estilos

---

## 🎯 RESULTADO ESPERADO

Após todos os testes:
- ✅ 95%+ de funcionalidade mobile
- ✅ 90%+ de usabilidade tablet
- ✅ 92%+ de UX desktop
- ✅ Modal de vitória celebrando 🎉
- ✅ Design moderno e consistente
- ✅ Responsividade completa

---

## 🚨 SE ALGO NÃO FUNCIONAR

### CSS não carrega
```tsx
// Verificar: frontend/src/index.tsx
import './styles/index.css'; // Deve ser este caminho
```

### Modal ainda aparece como erro
```tsx
// Verificar: frontend/src/pages/Game.tsx linha ~299
const isGameOver = error.includes('Game Over') || error.includes('wins');
```

### Tabuleiro muito grande mobile
```css
// Verificar: frontend/src/styles/game-responsive.css
@media (max-width: 479px) {
  .cell { width: 13px; height: 13px; }
}
```

---

## 📞 SUPORTE

1. Ler documentação: `DESIGN_SYSTEM_OVERHAUL.md`
2. Ver resumo: `DESIGN_IMPLEMENTATION_SUMMARY.md`
3. Checar este checklist
4. Inspecionar com DevTools (F12)
5. Consultar comentários nos arquivos CSS

---

**BOA SORTE! 🎮⚫⚪**

Qualquer dúvida, os arquivos estão bem documentados!