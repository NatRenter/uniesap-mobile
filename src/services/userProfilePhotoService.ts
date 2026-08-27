import * as ImagePicker from "expo-image-picker";

import { Platform } from "react-native";

/*
 * ============================================================================
 * FOTOGRAFÍA DE PERFIL
 * ============================================================================
 *
 * Centralizamos aquí el uso de expo-image-picker.
 *
 * La pantalla solamente recibe una URI y no necesita conocer
 * detalles de permisos o plataforma.
 */

export async function pickUserProfilePhoto(): Promise<string | null> {
  /*
   * Android/iOS necesitan permiso para acceder a la biblioteca.
   *
   * En Web el navegador gestiona el acceso mediante el selector.
   */
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error("Se necesita permiso para seleccionar una fotografía.");
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],

    allowsEditing: true,

    aspect: [1, 1],

    quality: 0.85,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];

  if (!asset?.uri) {
    throw new Error("No fue posible obtener la fotografía seleccionada.");
  }

  return asset.uri;
}
