import * as React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { Meal } from "@/types/models";
import {
  computeMealTotals,
  deleteMealById,
  getMealById,
} from "@/utils/meals-storage";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function MealDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [meal, setMeal] = React.useState<Meal | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const refreshMeal = React.useCallback(async () => {
    const mealId = String(id ?? "");
    if (!mealId) {
      setMeal(null);
      return;
    }

    const foundMeal = await getMealById(mealId);
    setMeal(foundMeal);
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      refreshMeal().catch(console.error);
    }, [refreshMeal]),
  );

  const handleDelete = React.useCallback(() => {
    if (!meal || isDeleting) return;

    Alert.alert(
      "Supprimer le repas",
      `Voulez-vous vraiment supprimer le repas "${meal.name}" ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteMealById(meal.id);
              router.replace("/");
            } catch (error) {
              console.error(error);
              Alert.alert(
                "Erreur",
                "Impossible de supprimer ce repas pour le moment.",
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [meal, isDeleting, router]);

  if (!meal) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Repas introuvable</ThemedText>
        <ThemedText style={styles.muted}>
          Ce repas n’existe plus ou son identifiant est invalide.
        </ThemedText>

        <Pressable onPress={() => router.replace("/")}>
          <ThemedText type="link">Retour à l’accueil</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const totals = computeMealTotals(meal);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{meal.name}</ThemedText>
      <ThemedText style={styles.muted}>{meal.date}</ThemedText>

      <View style={styles.summaryCard}>
        <ThemedText style={styles.summaryTitle}>Total nutritionnel</ThemedText>
        <ThemedText style={styles.summaryLine}>
          Calories : {round1(totals.calories)} kcal
        </ThemedText>
        <ThemedText style={styles.summaryLine}>
          Protéines : {round1(totals.proteins)} g
        </ThemedText>
        <ThemedText style={styles.summaryLine}>
          Glucides : {round1(totals.carbs)} g
        </ThemedText>
        <ThemedText style={styles.summaryLine}>
          Lipides : {round1(totals.fats)} g
        </ThemedText>
      </View>

      <ThemedText style={styles.sectionTitle}>Aliments</ThemedText>

      {meal.foods.length === 0 ? (
        <ThemedText style={styles.muted}>
          Aucun aliment dans ce repas.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {meal.foods.map((food, index) => (
            <View key={`${food.id}-${index}`} style={styles.foodCard}>
              <ThemedText style={styles.foodName}>{food.name}</ThemedText>

              {!!food.brand && (
                <ThemedText style={styles.muted}>{food.brand}</ThemedText>
              )}

              <ThemedText style={styles.foodLine}>
                Calories : {round1(food.calories)} kcal
              </ThemedText>
              <ThemedText style={styles.foodLine}>
                Protéines : {round1(food.proteins)} g
              </ThemedText>
              <ThemedText style={styles.foodLine}>
                Glucides : {round1(food.carbs)} g
              </ThemedText>
              <ThemedText style={styles.foodLine}>
                Lipides : {round1(food.fats)} g
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          isDeleting && styles.deleteButtonDisabled,
          pressed && styles.pressed,
        ]}
        onPress={handleDelete}
        disabled={isDeleting}
      >
        <ThemedText style={styles.deleteButtonText}>
          {isDeleting ? "Suppression..." : "Supprimer le repas"}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  muted: {
    opacity: 0.8,
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 15,
  },
  list: {
    gap: 10,
    marginTop: 4,
  },
  foodCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
  },
  foodLine: {
    fontSize: 15,
  },
  deleteButton: {
    marginTop: 16,
    backgroundColor: "#c62828",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.8,
  },
});