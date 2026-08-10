import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ProjectsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proyectos</Text>

      <Link href="/projects/aBc123">Abrir proyecto de prueba</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
});
