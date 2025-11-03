import React from 'react';
import { useUI } from '../contexts/UIContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    toggleTheme, 
    togglePlayerQueue, 
    toggleChat, 
    toggleVideoChat,
    updateAudioSetting,
    updateSetting 
  } = useUI();

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h3>Configurações</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="settings-content">
          {/* Modo de Visualização */}
          <div className="setting-group">
            <h4>Aparência</h4>
            <div className="setting-item">
              <span>Tema</span>
              <button 
                className={`theme-toggle ${settings.theme}`}
                onClick={toggleTheme}
              >
                <i className={`fas ${settings.theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
                {settings.theme === 'light' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>

          {/* Exibição de Elementos */}
          <div className="setting-group">
            <h4>Interface</h4>
            <div className="setting-item">
              <span>Fila de Jogadores</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showPlayerQueue}
                  onChange={togglePlayerQueue}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <span>Chat</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showChat}
                  onChange={toggleChat}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <span>Vídeochat</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showVideoChat}
                  onChange={toggleVideoChat}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Configurações de Áudio */}
          <div className="setting-group">
            <h4>Áudio</h4>
            <div className="setting-item">
              <span>Áudio do Vídeochat</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.audioSettings.videoChatAudio}
                  onChange={(e) => updateAudioSetting('videoChatAudio', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <span>Áudio Global</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.audioSettings.globalAudio}
                  onChange={(e) => updateAudioSetting('globalAudio', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <span>Efeitos Sonoros</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.audioSettings.soundEffects}
                  onChange={(e) => updateAudioSetting('soundEffects', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Configurações de Chat */}
          <div className="setting-group">
            <h4>Chat</h4>
            <div className="setting-item">
              <span>Modo do Chat</span>
              <select
                value={settings.chatMode}
                onChange={(e) => updateSetting('chatMode', e.target.value as 'active-players' | 'all-players')}
                className="chat-mode-select"
              >
                <option value="active-players">Jogadores Ativos</option>
                <option value="all-players">Todos os Jogadores</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;