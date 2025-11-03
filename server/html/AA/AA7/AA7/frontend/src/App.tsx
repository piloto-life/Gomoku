import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { useNavigationLogger } from './hooks/useNavigationLogger';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Lobby from './pages/Lobby';
import LoggerDebugPanel from './components/LoggerDebugPanel';
import logger from './utils/logger';

function App() {
  // Log app initialization
  React.useEffect(() => {
    logger.info('APP', 'Application initialized', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: logger.getSessionId(),
    });
  }, []);

  return (
    <Router>
      <AuthProvider>
        <GameProvider>
          <AppContent />
          <LoggerDebugPanel />
        </GameProvider>
      </AuthProvider>
    </Router>
  );
}

const AppContent: React.FC = () => {
  const { isInitializing } = useAuth();
  
  // Track navigation changes
  useNavigationLogger();

  if (isInitializing) {
    logger.debug('APP', 'App is initializing');
    return (
      <div className="loading-container">
        <h1>Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game/:gameId?" element={<Game />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
