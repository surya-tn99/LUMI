import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface AppContextType {
  isEmergencyMode: boolean;
  emergencyStartTime: number | null;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  isListening: boolean;
  transcript: string;
  triggerEmergency: () => void;
  clearEmergency: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setTranscript: (text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isEmergencyMode, setIsEmergencyMode] = useState(() => {
    return localStorage.getItem('lumi_emergency_active') === 'true';
  });
  const [emergencyStartTime, setEmergencyStartTime] = useState<number | null>(() => {
    const stored = localStorage.getItem('lumi_emergency_start');
    return stored ? parseInt(stored) : null;
  });

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const triggerEmergency = useCallback(() => {
    setIsEmergencyMode(true);
    const now = Date.now();
    setEmergencyStartTime(now);
    localStorage.setItem('lumi_emergency_active', 'true');
    localStorage.setItem('lumi_emergency_start', now.toString());
  }, []);

  const clearEmergency = useCallback(() => {
    setIsEmergencyMode(false);
    setEmergencyStartTime(null);
    localStorage.removeItem('lumi_emergency_active');
    localStorage.removeItem('lumi_emergency_start');
  }, []);

  return (
    <AppContext.Provider
      value={{
        isEmergencyMode,
        emergencyStartTime,
        leftSidebarOpen,
        rightSidebarOpen,
        isListening,
        transcript,
        triggerEmergency,
        clearEmergency,
        setLeftSidebarOpen,
        setRightSidebarOpen,
        setIsListening,
        setTranscript,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
