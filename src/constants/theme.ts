export const Colors = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceSecondary: "#F1F5F9",

    backgroundElement: "#F1F5F9",
    backgroundSelected: "#E2E8F0",

    text: "#1F2937",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",

    primary: "#1E5EFF",
    primaryPressed: "#194FD8",
    primarySoft: "#DCE8FF",

    border: "#E2E8F0",
    divider: "#E5E7EB",

    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
  },

  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    surfaceSecondary: "#263449",

    backgroundElement: "#1E293B",
    backgroundSelected: "#334155",

    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",

    primary: "#4D7CFF",
    primaryPressed: "#3C68E6",
    primarySoft: "#1E3A70",

    border: "#334155",
    divider: "#334155",

    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#38BDF8",
  },
};

export type ThemeColor = keyof typeof Colors.light;

export const Spacing = {
  // Atlas Design System
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Compatibilidad temporal con la plantilla Expo
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
} as const;

export const MaxContentWidth = 1200;

export const BottomTabInset = 80;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const FontSize = {
  caption: 12,
  small: 14,
  body: 16,
  cardTitle: 18,
  h3: 20,
  h2: 24,
  h1: 30,
  display: 36,
};

export const CompanyColors = [
  "#F97316", // naranja
  "#EF4444", // rojo
  "#3B82F6", // azul
  "#22C55E", // verde
  "#EAB308", // amarillo
  "#8B5CF6", // morado
  "#EC4899", // rosa
  "#64748B", // gris
] as const;

export const Fonts = {
  mono: "monospace",
} as const;
