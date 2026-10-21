import type { ThemeId } from "../engine";
import { fontFamilyMono, fontFamilySans } from "./fonts";

export const typeScale = {
  kicker: 40,
  title: 76,
  heading: 64,
  body: 44,
  code: 34,
  lineNumber: 32,
  caption: 40,
  token: 72,
  icon: 80,
} as const;

export const lineHeight = {
  tight: 1.08,
  body: 1.3,
  code: 1.45,
} as const;

export type ThemeTokens = {
  id: ThemeId;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  accentForeground: string;
  surface: string;
  surfaceBorder: string;
  codeBackground: string;
  codeForeground: string;
  highlight: string;
  highlightBar: string;
  captionBackground: string;
  captionForeground: string;
  consoleBackground: string;
  consoleForeground: string;
  connector: string;
  fontSans: string;
  fontMono: string;
};

export const themes: Record<ThemeId, ThemeTokens> = {
  dark: {
    id: "dark",
    background: "#10141A",
    foreground: "#F4F7FB",
    muted: "#C5D0DE",
    accent: "#F0B429",
    accentForeground: "#1C1404",
    surface: "#1A212B",
    surfaceBorder: "#3A4656",
    codeBackground: "#0C1016",
    codeForeground: "#F4F7FB",
    highlight: "#3A311C",
    highlightBar: "#F0B429",
    captionBackground: "#F4F7FB",
    captionForeground: "#10141A",
    consoleBackground: "#143528",
    consoleForeground: "#D8FFE9",
    connector: "#A9B8CA",
    fontSans: fontFamilySans,
    fontMono: fontFamilyMono,
  },
  light: {
    id: "light",
    background: "#F7F4EE",
    foreground: "#171A1F",
    muted: "#3E4854",
    accent: "#8A4E00",
    accentForeground: "#F7F4EE",
    surface: "#FFFFFF",
    surfaceBorder: "#D9D3C7",
    codeBackground: "#FFFFFF",
    codeForeground: "#171A1F",
    highlight: "#F3E2C0",
    highlightBar: "#8A4E00",
    captionBackground: "#171A1F",
    captionForeground: "#F7F4EE",
    consoleBackground: "#DDF3E6",
    consoleForeground: "#0F3D28",
    connector: "#3E4854",
    fontSans: fontFamilySans,
    fontMono: fontFamilyMono,
  },
};

export function themeTokens(theme: ThemeId): ThemeTokens {
  return themes[theme];
}
