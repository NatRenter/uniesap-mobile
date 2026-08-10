import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ProjectDetailScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del proyecto</Text>

      <Text style={styles.label}>UID recibido:</Text>

      <Text style={styles.uid}>{uid}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
  },
  uid: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "600",
  },
});
