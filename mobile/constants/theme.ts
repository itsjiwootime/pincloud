import { Platform } from "react-native";

export const COLORS = {
  ink: "#14213D",
  inkMuted: "#5C677D",
  sand: "#F5EFE2",
  paper: "#FFF9EF",
  paperStrong: "#FFFDF8",
  line: "#D8CDBA",
  lineStrong: "#B9A78A",
  accent: "#E76F51",
  accentDeep: "#C85536",
  accentSoft: "#F4BF96",
  teal: "#2A9D8F",
  tealSoft: "#BEE5E0",
  sky: "#90CAF9",
  sun: "#F3C969",
  danger: "#B7422F",
  white: "#FFFFFF",
  kakao: "#FEE500",
  kakaoText: "#3C1E1E",
} as const;

export const RADII = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: COLORS.ink,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 5,
  },
  floating: {
    shadowColor: COLORS.ink,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const DISPLAY_FONT_FAMILY = Platform.select({
  android: "serif",
  ios: "Georgia",
});
