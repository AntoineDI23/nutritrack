import { StyleSheet, View } from "react-native";
import { useUser } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SignOutButton } from "@/components/sign-out-button";

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profil</ThemedText>

      <View style={styles.card}>
        <ThemedText style={styles.label}>Email</ThemedText>
        <ThemedText style={styles.value}>
          {user?.emailAddresses?.[0]?.emailAddress ?? "Non renseigné"}
        </ThemedText>
      </View>

      <SignOutButton />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.8,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});