import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const FONT_SANS = "Inter";
export const FONT_MONO = "JetBrains Mono";

export const fontFamilySans = `"${FONT_SANS}", sans-serif`;
export const fontFamilyMono = `"${FONT_MONO}", ui-monospace, monospace`;

const faces = [
  { family: FONT_SANS, file: "fonts/Inter-400.woff2", weight: "400" },
  { family: FONT_SANS, file: "fonts/Inter-600.woff2", weight: "600" },
  { family: FONT_SANS, file: "fonts/Inter-700.woff2", weight: "700" },
  { family: FONT_MONO, file: "fonts/JetBrainsMono-400.woff2", weight: "400" },
  { family: FONT_MONO, file: "fonts/JetBrainsMono-600.woff2", weight: "600" },
] as const;

let started = false;

/** Loads the OFL faces shipped in public/fonts. Safe to call more than once. */
export function loadVideoFonts(): void {
  if (started || typeof document === "undefined") {
    return;
  }
  started = true;
  for (const face of faces) {
    void loadFont({
      family: face.family,
      url: staticFile(face.file),
      weight: face.weight,
      style: "normal",
      display: "block",
    });
  }
}

loadVideoFonts();
