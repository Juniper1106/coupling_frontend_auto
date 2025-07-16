import React, { createContext, useState, useContext, ReactNode } from 'react';

// 定义类型
type ProactiveIntervalContextType = number;
type ProactiveIntervalUpdateContextType = (value: number) => void;

// 创建 Context
const ProactiveIntervalContext = createContext<ProactiveIntervalContextType | undefined>(undefined);
const ProactiveIntervalUpdateContext = createContext<ProactiveIntervalUpdateContextType | undefined>(undefined);

export const useProactiveInterval = (): ProactiveIntervalContextType => {
  const context = useContext(ProactiveIntervalContext);
  if (context === undefined) {
    throw new Error('useProactiveInterval must be used within a ProactiveIntervalProvider');
  }
  return context;
};

export const useProactiveIntervalUpdate = (): ProactiveIntervalUpdateContextType => {
  const context = useContext(ProactiveIntervalUpdateContext);
  if (context === undefined) {
    throw new Error('useProactiveIntervalUpdate must be used within a ProactiveIntervalProvider');
  }
  return context;
};

interface ProactiveIntervalProviderProps {
  children: ReactNode;
}

export const ProactiveIntervalProvider: React.FC<ProactiveIntervalProviderProps> = ({ children }) => {
  const [globalNumber, setGlobalNumber] = useState<number>(15); // initial interval

  const updateGlobalNumber = (value: number) => {
    console.log('Updating proactive interval to:', value);
    setGlobalNumber(value);
  };

  return (
    <ProactiveIntervalContext.Provider value={globalNumber}>
      <ProactiveIntervalUpdateContext.Provider value={updateGlobalNumber}>
        {children}
      </ProactiveIntervalUpdateContext.Provider>
    </ProactiveIntervalContext.Provider>
  );
};
