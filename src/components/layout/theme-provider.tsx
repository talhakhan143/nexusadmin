"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { DEFAULT_PRESET_ID, getPreset } from "@/config/theme-presets";

const PRESET_KEY = "nexusadmin.theme.preset";

interface ThemeContextValue {
  presetId: string;
  setPreset: (id: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  presetId: DEFAULT_PRESET_ID,
  setPreset: () => {},
});

export function useThemePreset() {
  return React.useContext(ThemeContext);
}

function applyPreset(id: string) {
  const preset = getPreset(id);
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const tokens = isDark ? preset.dark : preset.light;
  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--primary-foreground", tokens.primaryForeground);
  root.style.setProperty("--ring", tokens.ring);
  root.style.setProperty("--sidebar-accent-foreground", tokens.primary);
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [presetId, setPresetIdState] = React.useState(DEFAULT_PRESET_ID);

  React.useEffect(() => {
    const stored = localStorage.getItem(PRESET_KEY) ?? DEFAULT_PRESET_ID;
    setPresetIdState(stored);
    applyPreset(stored);

    // Re-apply when light/dark changes
    const observer = new MutationObserver(() => applyPreset(stored));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const setPreset = React.useCallback((id: string) => {
    setPresetIdState(id);
    localStorage.setItem(PRESET_KEY, id);
    applyPreset(id);
  }, []);

  return (
    <NextThemesProvider {...props}>
      <ThemeContext.Provider value={{ presetId, setPreset }}>{children}</ThemeContext.Provider>
    </NextThemesProvider>
  );
}
