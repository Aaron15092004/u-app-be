import React, { createContext, useContext } from 'react';
import * as Colors from '../constants/colors';

interface Theme {
  colors: typeof Colors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
}

const theme: Theme = {
  colors: Colors,
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 4, md: 8, lg: 16, full: 9999 },
  typography: {
    sizes: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

const ThemeContext = createContext<Theme>(theme);

interface Props {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: Props): React.JSX.Element {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
