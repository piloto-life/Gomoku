import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UISettings {
  theme: 'light' | 'dark';
  showPlayerQueue: boolean;
  showChat: boolean;
  showVideoChat: boolean;
  audioSettings: {
    videoChatAudio: boolean;
    globalAudio: boolean;
    soundEffects: boolean;
  };
  chatMode: 'active-players' | 'all-players';
}

interface UIContextType {
  settings: UISettings;
  updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void;
  updateAudioSetting: <K extends keyof UISettings['audioSettings']>(
    key: K, 
    value: UISettings['audioSettings'][K]
  ) => void;
  toggleTheme: () => void;
  togglePlayerQueue: () => void;
  toggleChat: () => void;
  toggleVideoChat: () => void;
}

const defaultSettings: UISettings = {
  theme: 'light',
  showPlayerQueue: true,
  showChat: true,
  showVideoChat: true,
  audioSettings: {
    videoChatAudio: true,
    globalAudio: true,
    soundEffects: true,
  },
  chatMode: 'all-players',
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<UISettings>(() => {
    const saved = localStorage.getItem('gomoku-ui-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('gomoku-ui-settings', JSON.stringify(settings));
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateSetting = <K extends keyof UISettings>(key: K, value: UISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateAudioSetting = <K extends keyof UISettings['audioSettings']>(
    key: K, 
    value: UISettings['audioSettings'][K]
  ) => {
    setSettings(prev => ({
      ...prev,
      audioSettings: { ...prev.audioSettings, [key]: value }
    }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const togglePlayerQueue = () => {
    setSettings(prev => ({ ...prev, showPlayerQueue: !prev.showPlayerQueue }));
  };

  const toggleChat = () => {
    setSettings(prev => ({ ...prev, showChat: !prev.showChat }));
  };

  const toggleVideoChat = () => {
    setSettings(prev => ({ ...prev, showVideoChat: !prev.showVideoChat }));
  };

  return (
    <UIContext.Provider value={{
      settings,
      updateSetting,
      updateAudioSetting,
      toggleTheme,
      togglePlayerQueue,
      toggleChat,
      toggleVideoChat,
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};