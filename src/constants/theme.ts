export const colors = {
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#1A3A6B",
    600: "#1E3A5F",
    700: "#1A2E4A",
    800: "#0F1D33",
    900: "#0A1424",
  },
  accent: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
  },
  success: { light: "#DCFCE7", DEFAULT: "#22C55E", dark: "#166534" },
  warning: { light: "#FEF3C7", DEFAULT: "#F59E0B", dark: "#92400E" },
  error: { light: "#FEE2E2", DEFAULT: "#EF4444", dark: "#991B1B" },
  surface: { light: "#FFFFFF", DEFAULT: "#F8FAFC", dark: "#0F172A" },
  glass: { light: "rgba(255,255,255,0.7)", dark: "rgba(15,23,42,0.7)" },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 32, fontWeight: "800" as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "700" as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "700" as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
  label: { fontSize: 11, fontWeight: "700" as const, lineHeight: 14 },
};
