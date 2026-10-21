import { createContext, useContext, type FC, type ReactNode } from "react";
import type { ThemeId } from "../engine";
import { themes, type ThemeTokens } from "../theme/tokens";

const ThemeContext = createContext<ThemeTokens>(themes.dark);

export const ThemeProvider: FC<{ theme: ThemeId; children: ReactNode }> = ({
  theme,
  children,
}) => {
  return (
    <ThemeContext.Provider value={themes[theme]}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
