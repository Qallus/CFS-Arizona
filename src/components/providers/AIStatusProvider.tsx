'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type AIStatus = 'working' | 'thinking' | 'sleeping';

interface AIStatusContextType {
  status: AIStatus;
  setStatus: (status: AIStatus) => void;
  setThinking: () => void;
  setWorking: () => void;
  setIdle: () => void;
}

const AIStatusContext = createContext<AIStatusContextType | undefined>(undefined);

export function AIStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AIStatus>('sleeping');

  const setThinking = useCallback(() => setStatus('thinking'), []);
  const setWorking = useCallback(() => setStatus('working'), []);
  const setIdle = useCallback(() => setStatus('sleeping'), []);

  return (
    <AIStatusContext.Provider value={{ status, setStatus, setThinking, setWorking, setIdle }}>
      {children}
    </AIStatusContext.Provider>
  );
}

export function useAIStatus() {
  const context = useContext(AIStatusContext);
  if (context === undefined) {
    throw new Error('useAIStatus must be used within an AIStatusProvider');
  }
  return context;
}
