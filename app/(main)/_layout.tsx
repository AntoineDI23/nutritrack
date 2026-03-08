import * as React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ThemedView } from "@/components/themed-view";

export default function MainLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});