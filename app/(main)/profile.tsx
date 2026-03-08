import * as React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SignOutButton } from "@/components/sign-out-button";
import {
  getDailyCalorieGoal,
  saveDailyCalorieGoal,
} from "@/utils/settings-storage";

export default function ProfilePage() {
  const { user } = useUser();

  const [goalInput, setGoalInput] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadGoal = React.useCallback(async () => {
    const goal = await getDailyCalorieGoal();
    setGoalInput(String(goal));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadGoal().catch(console.error);
    }, [loadGoal]),
  );

  const handleSaveGoal = async () => {
    const numericGoal = Number(goalInput);

    if (!Number.isFinite(numericGoal) || numericGoal <= 0) {
      setError("Entre un objectif calorique valide.");
      setMessage(null);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      await saveDailyCalorieGoal(numericGoal);
      setGoalInput(String(Math.round(numericGoal)));
      setMessage("Objectif calorique enregistré.");
    } catch (e) {
      console.error(e);
      setError("Impossible d’enregistrer l’objectif calorique.");
      setMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profil</ThemedText>

      <View style={styles.card}>
        <ThemedText style={styles.label}>Email</ThemedText>
        <ThemedText style={styles.value}>
          {user?.emailAddresses?.[0]?.emailAddress ?? "Non renseigné"}
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.label}>Objectif calorique journalier</ThemedText>
        <TextInput
          style={styles.input}
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder="Ex : 2000"
          placeholderTextColor="#666666"
          keyboardType="numeric"
        />

        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
        {!!message && <ThemedText style={styles.success}>{message}</ThemedText>}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            isSaving && styles.saveButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSaveGoal}
          disabled={isSaving}
        >
          <ThemedText style={styles.saveButtonText}>
            {isSaving ? "Enregistrement..." : "Enregistrer l’objectif"}
          </ThemedText>
        </Pressable>
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
    gap: 8,
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  error: {
    color: "#c62828",
    fontWeight: "600",
  },
  success: {
    color: "#2e7d32",
    fontWeight: "600",
  },
});