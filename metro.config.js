// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/**
 * Configuración de Metro para UNIESAP Mobile.
 *
 * expo-sqlite utiliza WebAssembly en su implementación web.
 * Metro necesita reconocer los archivos .wasm como assets
 * para poder resolver correctamente esa dependencia.
 *
 * @type {import("expo/metro-config").MetroConfig}
 */
const config = getDefaultConfig(__dirname);

/*
 * Agregamos soporte para archivos WebAssembly.
 *
 * La comprobación evita insertar "wasm"
 * varias veces si Expo lo añade en una versión futura.
 */
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

module.exports = config;
