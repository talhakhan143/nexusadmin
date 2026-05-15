/**
 * Theme presets — primary color variants applied via CSS custom properties.
 * The active preset is persisted in localStorage and applied to <html>.
 */

export interface ThemePreset {
  id: string;
  name: string;
  // HSL "h s% l%" tuples, separate for light & dark
  light: { primary: string; primaryForeground: string; ring: string };
  dark: { primary: string; primaryForeground: string; ring: string };
  // Solid hex for swatch in the picker
  swatch: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "slate",
    name: "Slate",
    light: { primary: "222 47% 11%", primaryForeground: "210 40% 98%", ring: "222 47% 11%" },
    dark: { primary: "210 40% 98%", primaryForeground: "222 47% 11%", ring: "212 27% 84%" },
    swatch: "#1e293b",
  },
  {
    id: "blue",
    name: "Blue",
    light: { primary: "221 83% 53%", primaryForeground: "210 40% 98%", ring: "221 83% 53%" },
    dark: { primary: "217 91% 60%", primaryForeground: "222 47% 11%", ring: "224 76% 48%" },
    swatch: "#2563eb",
  },
  {
    id: "violet",
    name: "Violet",
    light: { primary: "262 83% 58%", primaryForeground: "210 40% 98%", ring: "262 83% 58%" },
    dark: { primary: "263 70% 67%", primaryForeground: "210 40% 98%", ring: "263 70% 60%" },
    swatch: "#7c3aed",
  },
  {
    id: "rose",
    name: "Rose",
    light: { primary: "346 77% 49%", primaryForeground: "210 40% 98%", ring: "346 77% 49%" },
    dark: { primary: "346 77% 60%", primaryForeground: "210 40% 98%", ring: "346 77% 60%" },
    swatch: "#e11d48",
  },
  {
    id: "green",
    name: "Green",
    light: { primary: "142 71% 35%", primaryForeground: "210 40% 98%", ring: "142 71% 35%" },
    dark: { primary: "142 71% 45%", primaryForeground: "210 40% 98%", ring: "142 71% 45%" },
    swatch: "#16a34a",
  },
  {
    id: "orange",
    name: "Orange",
    light: { primary: "24 95% 53%", primaryForeground: "210 40% 98%", ring: "24 95% 53%" },
    dark: { primary: "24 95% 60%", primaryForeground: "210 40% 98%", ring: "24 95% 60%" },
    swatch: "#f97316",
  },
];

export const DEFAULT_PRESET_ID = "blue";

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}
