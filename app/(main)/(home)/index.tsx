import * as React from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { Meal } from "@/types/models";
import { computeMealTotals, loadMeals } from "@/utils/meals-storage";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function Page() {
  const router = useRouter();
  const { user } = useUser();
  const [meals, setMeals] = React.useState<Meal[]>([]);

  const refreshMeals = React.useCallback(async () => {
    const storedMeals = await loadMeals();
    setMeals(storedMeals);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshMeals().catch(console.error);
    }, [refreshMeals]),
  );

  const openMeal = (id: string) => {
    router.push({
      pathname: "/(main)/(home)/[id]",
      params: { id },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">NutriTrack</ThemedText>

      <ThemedText style={styles.muted}>
        Bonjour {user?.emailAddresses?.[0]?.emailAddress}
      </ThemedText>

      <View style={styles.actions}>
        <Link href="/add">
          <ThemedText type="link">+ Ajouter un repas</ThemedText>
        </Link>
      </View>

      <ThemedText style={styles.sectionTitle}>Mes repas</ThemedText>

      {meals.length === 0 ? (
        <ThemedText style={styles.muted}>
          Aucun repas enregistré pour l’instant.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {meals.map((meal) => {
            const totals = computeMealTotals(meal);

            return (
              <Pressable
                key={meal.id}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => openMeal(meal.id)}
              >
                <ThemedText style={styles.cardTitle}>{meal.name}</ThemedText>
                <ThemedText style={styles.muted}>{meal.date}</ThemedText>
                <ThemedText style={styles.muted}>
                  {round1(totals.calories)} kcal
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
  },
  muted: {
    opacity: 0.8,
  },
  list: {
    gap: 10,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
});