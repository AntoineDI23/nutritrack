import * as React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useColorScheme } from "../hooks/use-color-scheme";

export function ThemedView({ style, ...props }: ViewProps) {
  const colorScheme = useColorScheme();

  return (
    <View
      {...props}
      style={[
        styles.base,
        colorScheme === "dark" ? styles.dark : styles.light,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  light: {
    backgroundColor: "#ffffff",
  },
  dark: {
    backgroundColor: "#0b0b0f",
  },
});
