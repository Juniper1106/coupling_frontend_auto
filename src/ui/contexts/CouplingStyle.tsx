import React, { createContext, useState, useContext, ReactNode } from 'react';

// 定义类型
type CouplingStyleContextType = string;
type CouplingStyleUpdateContextType = (value: string) => void;

// 创建 Context
const CouplingStyleContext = createContext<CouplingStyleContextType | undefined>(undefined);
const CouplingStyleUpdateContext = createContext<CouplingStyleUpdateContextType | undefined>(undefined);

export const useCouplingStyle = (): CouplingStyleContextType => {
  const context = useContext(CouplingStyleContext);
  if (context === undefined) {
    throw new Error('useCouplingStyle must be used within a CouplingStyleProvider');
  }
  return context;
};

export const useCouplingStyleUpdate = (): CouplingStyleUpdateContextType => {
  const context = useContext(CouplingStyleUpdateContext);
  if (context === undefined) {
    throw new Error('useCouplingStyleUpdate must be used within a CouplingStyleProvider');
  }
  return context;
};

interface CouplingStyleProviderProps {
  children: ReactNode;
}

export const CouplingStyleProvider: React.FC<CouplingStyleProviderProps> = ({ children }) => {
  const [globalString, setGlobalString] = useState<string>('DISC'); // initial state

  return (
    <CouplingStyleContext.Provider value={globalString}>
      <CouplingStyleUpdateContext.Provider value={setGlobalString}>
        {children}
      </CouplingStyleUpdateContext.Provider>
    </CouplingStyleContext.Provider>
  );
};
