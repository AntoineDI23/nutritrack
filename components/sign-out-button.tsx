import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.replace("/login");
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isLoading && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
      onPress={handleSignOut}
      disabled={isLoading}
    >
      <ThemedText style={styles.buttonText}>
        {isLoading ? "Déconnexion..." : "Se déconnecter"}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#c62828",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
});