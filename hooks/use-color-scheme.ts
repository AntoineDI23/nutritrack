import { ColorSchemeName, useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const scheme = useRNColorScheme();
  return scheme ?? "light";
}