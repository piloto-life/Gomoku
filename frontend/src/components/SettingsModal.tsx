import React from 'react';
import { useUI } from '../contexts/UIContext';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const {
        settings,
        toggleTheme,
        togglePlayerQueue,
        toggleChat,
        toggleVideoChat
    } = useUI();

    if (!isOpen) return null;

    return (
        <>
            <div className="settings-modal-overlay" onClick={onClose} />
            <div className="settings-modal">
                <div className="settings-modal-header">
                    <h2>
                        <i className="fas fa-cog"></i>
                        Configurações
                    </h2>
                    <button className="close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="settings-modal-content">
                    {/* Theme Settings */}
                    <div className="settings-section">
                        <h3>
                            <i className="fas fa-palette"></i>
                            Aparência
                        </h3>
                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Tema</label>
                                <span className="setting-description">
                                    {settings.theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                                </span>
                            </div>
                            <button
                                className="toggle-button"
                                onClick={toggleTheme}
                            >
                                <i className={`fas fa-${settings.theme === 'dark' ? 'moon' : 'sun'}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Display Settings */}
                    <div className="settings-section">
                        <h3>
                            <i className="fas fa-eye"></i>
                            Exibição
                        </h3>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Fila de Jogadores</label>
                                <span className="setting-description">
                                    Mostrar lista de jogadores aguardando
                                </span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.showPlayerQueue}
                                    onChange={togglePlayerQueue}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Chat</label>
                                <span className="setting-description">
                                    Exibir janela de chat
                                </span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.showChat}
                                    onChange={toggleChat}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Vídeo Chat</label>
                                <span className="setting-description">
                                    Exibir webcam durante partidas
                                </span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.showVideoChat}
                                    onChange={toggleVideoChat}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* Audio Settings - Placeholder for future */}
                    <div className="settings-section">
                        <h3>
                            <i className="fas fa-volume-up"></i>
                            Áudio
                        </h3>
                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Efeitos Sonoros</label>
                                <span className="setting-description">
                                    Sons de jogadas e notificações
                                </span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={true}
                                    disabled
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="settings-modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </>
    );
};

export default SettingsModal;
