import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SignOutButton } from "@/components/sign-out-button";

type MealItem = {
  code: string;
  name: string;
  brands?: string;
  grams: number;
  nutrimentsPer100g: {
    kcal?: number;
    proteins?: number;
    carbs?: number;
    fat?: number;
  };
};

type Meal = {
  id: string;
  title: string;
  createdAt: string; // ISO
  items: MealItem[];
};

const STORAGE_KEY = "nutritrack.meals.v1";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function computeTotals(meal: Meal) {
  let kcal = 0;
  let proteins = 0;
  let carbs = 0;
  let fat = 0;

  for (const it of meal.items) {
    const factor = (it.grams || 0) / 100;
    kcal += (it.nutrimentsPer100g.kcal ?? 0) * factor;
    proteins += (it.nutrimentsPer100g.proteins ?? 0) * factor;
    carbs += (it.nutrimentsPer100g.carbs ?? 0) * factor;
    fat += (it.nutrimentsPer100g.fat ?? 0) * factor;
  }

  return {
    kcal: round1(kcal),
    proteins: round1(proteins),
    carbs: round1(carbs),
    fat: round1(fat),
  };
}

export default function Page() {
  const { user } = useUser();

  const [meals, setMeals] = React.useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = React.useState<string | null>(null);
  const selectedMeal = meals.find((m) => m.id === selectedMealId) ?? null;

  const loadMeals = React.useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Meal[]) : [];
    setMeals(Array.isArray(parsed) ? parsed : []);
  }, []);

  React.useEffect(() => {
    loadMeals().catch(console.error);
  }, [loadMeals]);

  const backToList = () => setSelectedMealId(null);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">NutriTrack</ThemedText>

      <SignedOut>
        <ThemedText>Connecte-toi pour gérer tes repas.</ThemedText>

        <View style={styles.row}>
          <Link href="/(auth)/sign-in">
            <ThemedText type="link">Sign in</ThemedText>
          </Link>
          <Link href="/(auth)/sign-up">
            <ThemedText type="link">Sign up</ThemedText>
          </Link>
        </View>
      </SignedOut>

      <SignedIn>
        <ThemedText>Bonjour {user?.emailAddresses?.[0]?.emailAddress}</ThemedText>

        <View style={styles.row}>
          <Link href="/add">
            <ThemedText type="link">+ Ajouter un repas</ThemedText>
          </Link>
          <SignOutButton />
        </View>

        {!selectedMeal ? (
          <>
            <ThemedText style={styles.sectionTitle}>Mes repas</ThemedText>

            {meals.length === 0 ? (
              <ThemedText style={styles.muted}>Aucun repas enregistré pour l’instant.</ThemedText>
            ) : (
              <View style={styles.list}>
                {meals
                  .slice()
                  .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                  .map((meal) => {
                    const totals = computeTotals(meal);
                    const date = new Date(meal.createdAt).toLocaleString();

                    return (
                      <Pressable
                        key={meal.id}
                        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                        onPress={() => setSelectedMealId(meal.id)}
                      >
                        <ThemedText style={styles.cardTitle}>{meal.title}</ThemedText>
                        <ThemedText style={styles.muted}>{date}</ThemedText>
                        <ThemedText style={styles.muted}>
                          {totals.kcal} kcal • P {totals.proteins}g • G {totals.carbs}g • L {totals.fat}g
                        </ThemedText>
                      </Pressable>
                    );
                  })}
              </View>
            )}
          </>
        ) : (
          <>
            <Pressable onPress={backToList} style={styles.backBtn}>
              <ThemedText type="link">← Retour</ThemedText>
            </Pressable>

            <ThemedText style={styles.sectionTitle}>{selectedMeal.title}</ThemedText>
            <ThemedText style={styles.muted}>
              {new Date(selectedMeal.createdAt).toLocaleString()}
            </ThemedText>

            {(() => {
              const totals = computeTotals(selectedMeal);
              return (
                <View style={styles.summary}>
                  <ThemedText style={styles.summaryText}>{totals.kcal} kcal</ThemedText>
                  <ThemedText style={styles.muted}>
                    Protéines {totals.proteins}g • Glucides {totals.carbs}g • Lipides {totals.fat}g
                  </ThemedText>
                </View>
              );
            })()}

            <ThemedText style={styles.sectionTitle}>Aliments</ThemedText>
            {selectedMeal.items.length === 0 ? (
              <ThemedText style={styles.muted}>Aucun aliment dans ce repas.</ThemedText>
            ) : (
              <View style={styles.list}>
                {selectedMeal.items.map((it, idx) => {
                  const factor = it.grams / 100;
                  const kcal = round1((it.nutrimentsPer100g.kcal ?? 0) * factor);

                  return (
                    <View key={`${it.code}-${idx}`} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.cardTitle}>{it.name}</ThemedText>
                        {it.brands ? <ThemedText style={styles.muted}>{it.brands}</ThemedText> : null}
                        <ThemedText style={styles.muted}>
                          {it.grams}g • {kcal} kcal
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </SignedIn>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  sectionTitle: { marginTop: 12, fontSize: 18, fontWeight: "700" },
  muted: { opacity: 0.8 },
  list: { gap: 10, marginTop: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
  },
  cardPressed: { opacity: 0.75 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  backBtn: { paddingVertical: 6, alignSelf: "flex-start" },
  summary: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  summaryText: { fontSize: 18, fontWeight: "800" },
  itemRow: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
});
