import * as React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getFoodByBarcode } from "@/services/open-food-facts";
import { setLastScannedFood } from "@/state/scan-result";

export default function CameraPage() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onBarcodeScanned = React.useCallback(
    async (result: { data: string }) => {
      if (isProcessing) return;

      const barcode = (result?.data ?? "").trim();
      if (!barcode) return;

      try {
        setIsProcessing(true);
        setError(null);

        const food = await getFoodByBarcode(barcode);

        if (!food) {
          setError("Produit non trouvé dans la base Open Food Facts.");
          return;
        }

        setLastScannedFood(food);
        router.back();
      } catch {
        setError("Erreur lors de la récupération du produit scanné.");
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, router],
  );

  if (!permission) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
        <ThemedText>Chargement…</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="title" style={styles.centerText}>
          Scanner un code-barres
        </ThemedText>

        <ThemedText style={[styles.centerText, styles.muted]}>
          On a besoin de la caméra uniquement pour scanner les aliments.
        </ThemedText>

        {permission.canAskAgain ? (
          <Pressable style={styles.button} onPress={() => requestPermission()}>
            <ThemedText style={styles.buttonText}>Autoriser la caméra</ThemedText>
          </Pressable>
        ) : (
          <ThemedText style={[styles.centerText, styles.muted]}>
            Permission refusée. Active la caméra dans les réglages du téléphone.
          </ThemedText>
        )}

        <Pressable style={styles.link} onPress={() => router.back()}>
          <ThemedText type="link">Annuler</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
      />

      <View style={styles.overlay}>
        <ThemedText style={styles.overlayText}>
          Place le code-barres dans le cadre
        </ThemedText>

        {isProcessing && (
          <View style={styles.processingBox}>
            <ActivityIndicator />
            <ThemedText style={styles.processingText}>
              Recherche du produit…
            </ThemedText>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>

            <Pressable
              style={styles.retryButton}
              onPress={() => setError(null)}
            >
              <ThemedText style={styles.retryButtonText}>
                Scanner à nouveau
              </ThemedText>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.link} onPress={() => router.back()}>
          <ThemedText type="link">Annuler</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    padding: 20,
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  centerText: {
    textAlign: "center",
  },
  muted: {
    opacity: 0.85,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  overlayText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  processingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  processingText: {
    color: "white",
    fontWeight: "600",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  button: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
  },
  link: {
    paddingVertical: 10,
  },
});