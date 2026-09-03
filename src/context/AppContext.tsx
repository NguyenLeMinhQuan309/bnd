import React, { createContext } from 'react';

export interface AppContextType {
  appName: string;
  version: string;
  isDarkMode: boolean;
  language: string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: AppContextType = {
    appName: 'Bannoidia',
    version: '1.0.0',
    isDarkMode: false,
    language: 'vi',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
