import type React from "react";
import { createContext, useContext, useState } from "react";
import { Pressable, Text } from "react-native";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceSubtle: string;
  text: string;
  textSubtle: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryFg: string;
  danger: string;
  accent: string;
  muted: string;
  card: string;
  overlay: string;
}

export const lightTheme: ThemeColors = {
  mode: "light",
  bg: "#f8fafc",
  surface: "#ffffff",
  surfaceSubtle: "#f1f5f9",
  text: "#0f172a",
  textSubtle: "#64748b",
  border: "#cbd5e1",
  borderSubtle: "#e2e8f0",
  primary: "#0284c7",
  primaryFg: "#ffffff",
  danger: "#dc2626",
  accent: "#38bdf8",
  muted: "#94a3b8",
  card: "#ffffff",
  overlay: "rgba(15, 23, 42, 0.45)",
};

export const darkTheme: ThemeColors = {
  mode: "dark",
  bg: "#090d16",
  surface: "#111827",
  surfaceSubtle: "#1f2937",
  text: "#f9fafb",
  textSubtle: "#9ca3af",
  border: "#374151",
  borderSubtle: "#1f2937",
  primary: "#38bdf8",
  primaryFg: "#090d16",
  danger: "#f87171",
  accent: "#0284c7",
  muted: "#6b7280",
  card: "#111827",
  overlay: "rgba(0, 0, 0, 0.75)",
};

interface ThemeContextValue {
  theme: ThemeColors;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: "light",
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({
  children,
  initialMode = "light",
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}): React.JSX.Element {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const theme = mode === "dark" ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeToggle(): React.JSX.Element {
  const { mode, toggleTheme, theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      onPress={toggleTheme}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: theme.surfaceSubtle,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: "600" }}>
        {mode === "light" ? "🌙 Dark" : "☀️ Light"}
      </Text>
    </Pressable>
  );
}
