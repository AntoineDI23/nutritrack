import * as React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { setLastScan } from "@/state/scan-result";

export default function CameraPage() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);

  const onBarcodeScanned = React.useCallback(
    (result: { data: string }) => {
      if (scanned) return;

      const barcode = (result?.data ?? "").trim();
      if (!barcode) return;

      setScanned(true);
      setLastScan(barcode);
      router.back();
    },
    [scanned, router],
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
        <ThemedText type="title" style={{ textAlign: "center" }}>
          Scanner un code-barres
        </ThemedText>
        <ThemedText style={{ textAlign: "center", opacity: 0.85 }}>
          On a besoin de la caméra uniquement pour scanner les aliments.
        </ThemedText>

        {permission.canAskAgain ? (
          <Pressable style={styles.button} onPress={() => requestPermission()}>
            <ThemedText style={styles.buttonText}>Autoriser la caméra</ThemedText>
          </Pressable>
        ) : (
          <ThemedText style={{ textAlign: "center", opacity: 0.85 }}>
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
        <ThemedText style={styles.overlayText}>Place le code-barres dans le cadre</ThemedText>

        <Pressable style={styles.link} onPress={() => router.back()}>
          <ThemedText type="link">Annuler</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    padding: 20,
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
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
  },
  button: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "white", fontWeight: "800" },
  link: { paddingVertical: 10 },
});