import * as React from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";

export default function HomeLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Mes repas",
          headerShown: true,
          headerRight: () => (
            <Pressable onPress={() => router.push("/profile")} style={{ paddingHorizontal: 12 }}>
              <ThemedText type="link">Profil</ThemedText>
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: "Détail du repas",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
