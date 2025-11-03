# 🎨 Guia Rápido - Design System Gomoku

## 📦 Instalação

Os arquivos CSS já estão criados em `frontend/src/styles/`. Basta garantir que o import esteja correto:

```tsx
// frontend/src/index.tsx
import './styles/index.css';
```

---

## 🎯 Classes Mais Usadas

### 1. Botões

```html
<!-- Primário (Roxo) -->
<button className="btn btn-primary">Criar Jogo</button>

<!-- Sucesso (Verde) -->
<button className="btn btn-success">Confirmar</button>

<!-- Perigo (Vermelho) -->
<button className="btn btn-danger">Excluir</button>

<!-- Outline -->
<button className="btn btn-outline">Cancelar</button>

<!-- Tamanhos -->
<button className="btn btn-primary btn-sm">Pequeno</button>
<button className="btn btn-primary btn-lg">Grande</button>
<button className="btn btn-primary btn-block">Largura Total</button>
```

### 2. Cards

```html
<!-- Card Básico -->
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Título</h3>
  </div>
  <div className="card-body">
    <p>Conteúdo do card...</p>
  </div>
  <div className="card-footer">
    <button className="btn btn-primary">Ação</button>
  </div>
</div>
```

### 3. Grid System

```html
<!-- Grid Responsivo -->
<div className="grid grid-cols-3 gap-md">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
</div>

<!-- Muda para 2 colunas em tablet, 1 em mobile automaticamente -->
```

### 4. Formulários

```html
<form className="auth-form">
  <div className="form-group">
    <label htmlFor="email">Email</label>
    <input 
      type="email" 
      id="email" 
      placeholder="seu@email.com"
    />
  </div>
  
  <div className="form-group">
    <label htmlFor="password">Senha</label>
    <div className="password-input-wrapper">
      <input 
        type="password" 
        id="password"
      />
      <button type="button" className="password-toggle">👁️</button>
    </div>
  </div>
  
  {error && <div className="form-error">{error}</div>}
  
  <button className="btn btn-primary btn-block auth-submit">
    Entrar
  </button>
</form>
```

### 5. Badges

```html
<!-- Status -->
<span className="badge badge-success">Ativo</span>
<span className="badge badge-danger">Inativo</span>
<span className="badge badge-warning">Pendente</span>
<span className="badge badge-info">Info</span>
<span className="badge badge-primary">Novo</span>

<!-- Uso -->
<div className="game-card">
  <span className="badge badge-success">Online</span>
  <h3>Jogo #1234</h3>
</div>
```

### 6. Loading States

```html
<!-- Spinner -->
<div className="loading">
  <div className="loading-spinner"></div>
  <p className="loading-text">Carregando...</p>
</div>

<!-- Skeleton -->
<div className="skeleton skeleton-card"></div>
<div className="skeleton skeleton-title"></div>
<div className="skeleton skeleton-text"></div>
```

### 7. Modals

```html
<div className="modal-overlay">
  <div className="modal">
    <div className="modal-header">
      <h2 className="modal-title">Título</h2>
      <button className="modal-close">×</button>
    </div>
    <div className="modal-body">
      <p>Conteúdo do modal...</p>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary">Cancelar</button>
      <button className="btn btn-primary">Confirmar</button>
    </div>
  </div>
</div>
```

### 8. Toast Notifications

```html
<div className="toast-container">
  <div className="toast success">
    <span className="toast-icon">✅</span>
    <div className="toast-content">
      <div className="toast-title">Sucesso!</div>
      <div className="toast-message">Ação realizada com sucesso</div>
    </div>
    <button className="toast-close">×</button>
  </div>
</div>
```

---

## 🎨 Variáveis CSS Disponíveis

### Cores

```css
/* Usar em componentes personalizados */
.meu-componente {
  background: var(--primary-color);     /* #667eea - Roxo */
  color: var(--success-color);          /* #48bb78 - Verde */
  border: 1px solid var(--danger-color); /* #f56565 - Vermelho */
}
```

Variáveis disponíveis:
- `--primary-color` / `--primary-dark`
- `--success-color`
- `--danger-color`
- `--warning-color`
- `--info-color`
- `--text-color` / `--text-muted`
- `--bg-primary` / `--bg-secondary`
- `--border-color`

### Espaçamento

```css
.meu-box {
  padding: var(--spacing-md);     /* 1rem = 16px */
  margin: var(--spacing-lg);      /* 1.5rem = 24px */
  gap: var(--spacing-xl);         /* 2rem = 32px */
}
```

Escala disponível:
- `--spacing-xs` (4px)
- `--spacing-sm` (8px)
- `--spacing-md` (16px)
- `--spacing-lg` (24px)
- `--spacing-xl` (32px)
- `--spacing-2xl` (48px)

### Bordas

```css
.card-custom {
  border-radius: var(--radius-lg);  /* 0.75rem */
  box-shadow: var(--shadow-md);     /* Sombra média */
}
```

Disponível:
- `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-xl` / `--radius-full`
- `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-xl`

### Transições

```css
.hover-element {
  transition: all var(--transition-base); /* 300ms cubic-bezier */
}

.hover-element:hover {
  transform: translateY(-4px);
}
```

Disponível:
- `--transition-fast` (150ms)
- `--transition-base` (300ms)
- `--transition-slow` (500ms)

---

## 🎯 Classes Utilitárias

### Flex

```html
<div className="flex items-center justify-between gap-md">
  <span>Esquerda</span>
  <span>Direita</span>
</div>

<div className="flex flex-col gap-sm">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Texto

```html
<p className="text-primary font-bold">Texto destaque</p>
<p className="text-muted">Texto secundário</p>
<p className="text-center">Centralizado</p>
```

### Espaçamento

```html
<div className="mb-lg">Margin bottom large</div>
<div className="mt-md">Margin top medium</div>
<div className="p-xl">Padding extra large</div>
```

### Visibilidade

```html
<!-- Esconde em mobile, mostra em desktop -->
<div className="hide-mobile show-desktop">Desktop only</div>

<!-- Esconde em desktop, mostra em mobile -->
<div className="show-mobile hide-desktop">Mobile only</div>
```

---

## 📱 Responsividade Automática

Muitas classes já são responsivas por padrão:

```html
<!-- Grid: 4 cols → 2 cols → 1 col automaticamente -->
<div className="grid grid-cols-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</div>
```

**Desktop (>1024px)**: 4 colunas
**Tablet (768-1024px)**: 2 colunas  
**Mobile (<768px)**: 1 coluna

---

## 🎮 Componentes de Game

### Turn Indicator

```html
<div className="turn-indicator my-turn">
  ✓ Seu turno
</div>

<div className="turn-indicator opponent-turn">
  ⏳ Aguardando oponente
</div>
```

### Player Info

```html
<div className="player-info active">
  <div className="player-avatar">L</div>
  <div className="player-details">
    <div className="player-name">Luan</div>
    <div className="player-stone black">Pedra Preta</div>
  </div>
</div>
```

### Game Card (Lobby)

```html
<div className="game-card">
  <div className="game-card-header">
    <span className="game-id">#1234</span>
    <span className="game-status waiting">Aguardando</span>
  </div>
  
  <div className="game-card-body">
    <div className="game-players">
      <div className="player-slot">
        <div className="player-avatar-small">L</div>
        <span>Luan</span>
      </div>
      <div className="vs-badge">VS</div>
      <div className="player-slot empty">
        Aguardando jogador...
      </div>
    </div>
  </div>
  
  <div className="game-card-footer">
    <button className="btn btn-primary btn-sm">Entrar</button>
  </div>
</div>
```

---

## 🌗 Dark Mode

Para ativar dark mode, adicionar atributo no elemento raiz:

```tsx
// No componente
<div data-theme="dark">
  {/* Conteúdo com dark mode */}
</div>
```

Todas as cores mudam automaticamente via CSS Variables.

---

## 🎨 Customização

### Mudar Cor Primary

```css
/* Criar arquivo: frontend/src/styles/custom.css */
:root {
  --primary-color: #ff6b6b; /* Vermelho ao invés de roxo */
  --primary-dark: #ee5a52;
}

/* Importar depois do index.css */
```

### Adicionar Nova Cor

```css
:root {
  --brand-color: #00d2ff;
}

.btn-brand {
  background: linear-gradient(135deg, var(--brand-color), #0099cc);
  color: white;
}
```

### Mudar Fonte

```css
body {
  font-family: 'Comic Sans MS', cursive; /* Não recomendado! 😅 */
}
```

---

## 🚀 Exemplos Práticos

### Página de Login Completa

```tsx
export const Login = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">⚫⚪</div>
          <h1 className="auth-title">Bem-vindo</h1>
          <p className="auth-subtitle">Entre para jogar Gomoku</p>
        </div>
        
        <div className="auth-body">
          <form className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="seu@email.com" />
            </div>
            
            <div className="form-group">
              <label>Senha</label>
              <input type="password" placeholder="••••••" />
            </div>
            
            <button className="btn btn-primary btn-block auth-submit">
              Entrar
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>Não tem conta? <a href="/register" className="auth-link">Criar conta</a></p>
        </div>
      </div>
    </div>
  );
};
```

### Card de Jogo no Lobby

```tsx
<div className="games-grid">
  {games.map(game => (
    <div key={game.id} className="game-card">
      <div className="game-card-header">
        <span className="game-id">#{game.id.slice(0, 8)}</span>
        <span className={`game-status ${game.status}`}>
          {game.status}
        </span>
      </div>
      
      <div className="game-card-body">
        <div className="game-info-grid">
          <div className="info-item">
            <span className="info-label">Modo</span>
            <span className="info-value">{game.mode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Tempo</span>
            <span className="info-value">{game.time}</span>
          </div>
        </div>
      </div>
      
      <div className="game-card-footer">
        <button className="btn btn-primary btn-sm btn-block">
          Entrar no Jogo
        </button>
      </div>
    </div>
  ))}
</div>
```

---

## 📚 Referências Rápidas

### Quando usar cada arquivo CSS

- `responsive-design-system.css` → Foundation (não mexer)
- `game-responsive.css` → Estilos do tabuleiro
- `lobby-responsive.css` → Lista de jogos
- `auth-responsive.css` → Login/Register
- `pages-responsive.css` → Home/Profile
- `index.css` → Utilities (Toast, Modal, Badges)

### Hierarquia de Imports

```css
/* index.css importa tudo nesta ordem: */
1. responsive-design-system.css  (base)
2. auth-responsive.css           (auth pages)
3. lobby-responsive.css          (lobby)
4. game-responsive.css           (game)
5. pages-responsive.css          (home/profile)
6. utilities                     (helpers)
```

---

## 🎯 Dicas de Performance

### ✅ Boas Práticas

```css
/* Use transform ao invés de top/left */
.animated {
  transform: translateY(-4px); /* GPU accelerated ✅ */
}

/* Evite */
.animated {
  top: -4px; /* CPU intensive ❌ */
}
```

### ✅ Animações Suaves

```css
/* Anime apenas transform e opacity */
.hover-card {
  transition: transform 0.3s, opacity 0.3s; /* ✅ */
}

/* Evite animar tudo */
.hover-card {
  transition: all 0.3s; /* ❌ Mais lento */
}
```

---

## 🐛 Troubleshooting

### Estilos não aplicam
1. Verificar import em `index.tsx`
2. Limpar cache (`Ctrl+Shift+R`)
3. Verificar nome da classe (typo?)
4. Inspecionar com DevTools (F12)

### Responsividade não funciona
1. Verificar viewport meta tag no HTML
2. Testar em DevTools (Device Toolbar)
3. Verificar media queries no CSS
4. Usar unidades relativas (rem, %, vw)

### Dark mode não muda
1. Verificar `data-theme="dark"` no elemento
2. Verificar se variáveis CSS estão definidas
3. Inspecionar com DevTools → Computed styles

---

## 🎓 Conclusão

Este design system oferece:
- ✅ 60+ variáveis CSS
- ✅ 20+ componentes prontos
- ✅ Responsividade automática
- ✅ Dark mode built-in
- ✅ Animações suaves
- ✅ Acessibilidade

**Comece usando os componentes prontos e customize conforme necessário!**

🚀 Happy Coding! ⚫⚪