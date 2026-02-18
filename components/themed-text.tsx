import * as React from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { useColorScheme } from "../hooks/use-color-scheme";

type ThemedTextType = "default" | "title" | "link";

type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
};

export function ThemedText({ style, type = "default", ...props }: ThemedTextProps) {
  const colorScheme = useColorScheme();

  const textColor = colorScheme === "dark" ? "#ffffff" : "#111111";
  const linkColor = "#0a7ea4";

  const typeStyle = textStyles[type] ?? textStyles.default;

  return (
    <Text
      {...props}
      style={[
        { color: type === "link" ? linkColor : textColor },
        typeStyle,
        style,
      ]}
    />
  );
}

const textStyles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  link: {
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
