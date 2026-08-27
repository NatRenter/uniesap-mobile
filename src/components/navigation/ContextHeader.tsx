import {
    Pressable,
    StyleSheet,
    Text,
    View,
    type ViewStyle,
} from "react-native";

import { FontSize, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

/*
 * ============================================================================
 * CONTEXT HEADER
 * ============================================================================
 *
 * Encabezado reutilizable para pantallas internas.
 *
 * Navegación global:
 * Inicio | Empresas | Trabajo | Perfil
 *
 * Navegación contextual:
 * ← Empresa
 * ← Inmuebles
 * ← Reportes
 *
 * Así el usuario puede regresar un nivel
 * sin perder el acceso directo a los módulos principales.
 */

type ContextHeaderProps = {
  /*
   * Nombre del nivel anterior.
   *
   * Ejemplos:
   * Empresas
   * AutoZone
   * Inmuebles
   */
  backLabel?: string;

  /*
   * Acción exacta para regresar.
   *
   * La pantalla define el destino para no depender
   * del historial del navegador.
   */
  onBack?: () => void;

  /*
   * Contexto superior de la pantalla.
   *
   * Normalmente será el nombre de la empresa.
   */
  contextLabel?: string;

  /*
   * Color representativo opcional.
   */
  contextColor?: string;

  /*
   * Título principal.
   */
  title: string;

  /*
   * Descripción breve.
   */
  subtitle?: string;

  /*
   * Acción secundaria opcional.
   *
   * Ejemplo:
   * Editar
   */
  actionLabel?: string;

  onAction?: () => void;

  /*
   * Permite extender estilos desde la pantalla.
   */
  style?: ViewStyle;
};

export function ContextHeader({
  backLabel,
  onBack,
  contextLabel,
  contextColor,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: ContextHeaderProps) {
  const { colors } = useAppTheme();

  const showTopRow = Boolean(
    (backLabel && onBack) || (actionLabel && onAction),
  );

  return (
    <View style={[styles.container, style]}>
      {/* ================================================================ */}
      {/* NAVEGACIÓN CONTEXTUAL                                            */}
      {/* ================================================================ */}

      {showTopRow && (
        <View style={styles.topRow}>
          {backLabel && onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Volver a ${backLabel}`}
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.navigationButton,
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.navigationText,
                  {
                    color: colors.primary,
                  },
                ]}
                numberOfLines={1}
              >
                ← {backLabel}
              </Text>
            </Pressable>
          ) : (
            <View />
          )}

          {actionLabel && onAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              onPress={onAction}
              hitSlop={8}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={[
                  styles.actionText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* ================================================================ */}
      {/* CONTEXTO                                                         */}
      {/* ================================================================ */}

      {contextLabel ? (
        <Text
          style={[
            styles.context,
            {
              color: contextColor ?? colors.primary,
            },
          ]}
          numberOfLines={1}
        >
          {contextLabel.toUpperCase()}
        </Text>
      ) : null}

      {/* ================================================================ */}
      {/* TÍTULO                                                           */}
      {/* ================================================================ */}

      <Text
        style={[
          styles.title,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      {/* ================================================================ */}
      {/* DESCRIPCIÓN                                                      */}
      {/* ================================================================ */}

      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 *
 * ResponsiveContainer continúa controlando
 * el ancho máximo en celular, tablet y web.
 */
const styles = StyleSheet.create({
  container: {
    width: "100%",

    marginBottom: Spacing.lg,
  },

  topRow: {
    minHeight: 32,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: Spacing.md,

    marginBottom: Spacing.md,
  },

  navigationButton: {
    flexShrink: 1,
  },

  navigationText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  actionText: {
    fontSize: FontSize.small,
    fontWeight: "600",
  },

  context: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    letterSpacing: 0.8,

    marginBottom: Spacing.xs,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    maxWidth: 760,

    fontSize: FontSize.body,
    lineHeight: 24,
  },
});
