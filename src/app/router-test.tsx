import { StyleSheet, Text, View } from "react-native";

export default function RouterTestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo Router funcionando</Text>

      <Text style={styles.text}>
        Esta pantalla fue creada mediante una ruta basada en archivos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
    textAlign: "center",
  },
});
