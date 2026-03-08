import { StyleSheet } from "react-native";
import { useUser } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SignOutButton } from "@/components/sign-out-button";

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profil</ThemedText>

      <ThemedText style={styles.label}>Email</ThemedText>
      <ThemedText>{user?.emailAddresses?.[0]?.emailAddress ?? "Non renseigné"}</ThemedText>

      <SignOutButton />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  label: {
    fontWeight: "700",
  },
});