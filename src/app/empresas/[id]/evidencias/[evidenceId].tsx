import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidenceById } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsive } from "@/hooks/useResponsive";

export default function EvidenceDetailsScreen() {
  /*
   * Recupera los colores del tema actual.
   * Esto mantiene compatibilidad con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Detectamos el tamaño general de la pantalla.
   *
   * En este archivo solamente necesitamos distinguir
   * escritorio del resto de dispositivos.
   */
  const { isPhone, isTablet } = useResponsive();

  const isDesktop = !isPhone && !isTablet;

  /*
   * Parámetros dinámicos de:
   *
   * /empresas/[id]/evidencias/[evidenceId]
   */
  const { id, evidenceId } = useLocalSearchParams<{
    id: string;
    evidenceId: string;
  }>();

  /*
   * Recuperamos empresa y evidencia desde
   * nuestra capa centralizada de datos.
   */
  const company = getCompanyById(id);

  const evidence = getEvidenceById(evidenceId);

  /*
   * Estado controlado para rutas inválidas.
   */
  if (!company || !evidence) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              color: colors.primary,
              fontWeight: "600",
            }}
          >
            ‹ Volver
          </Text>
        </Pressable>

        <View style={styles.notFound}>
          <Text
            style={[
              styles.notFoundTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Evidencia no encontrada
          </Text>

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la información de esta evidencia.
          </Text>
        </View>
      </Screen>
    );
  }

  /*
   * Resolvemos las relaciones de la evidencia.
   *
   * Evidence
   *    ↓
   * Inspection
   *    ├── Property
   *    └── Form
   */
  const inspection = getInspectionById(evidence.inspectionId);

  /*
   * La evidencia ya contiene propertyId,
   * por lo que podemos resolver directamente
   * el inmueble.
   */
  const property = getPropertyById(evidence.propertyId);

  const form = inspection ? getFormById(inspection.formId) : undefined;

  /*
   * Convertimos el estado interno a texto
   * comprensible para la interfaz.
   */
  const evidenceStatusLabel =
    evidence.status === "synced" ? "Sincronizada" : "Pendiente";

  const evidenceStatusColor =
    evidence.status === "synced" ? colors.success : colors.warning;

  /*
   * Convertimos el tipo técnico de evidencia
   * a una etiqueta visual.
   */
  const evidenceTypeLabel =
    evidence.type === "photo" ? "Fotografía" : "Documento";

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * ResponsiveContainer controla:
         *
         * - padding horizontal
         * - espacio superior
         * - ancho máximo
         * - centrado en pantallas grandes
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* NAVEGACIÓN */}
          {/* ====================================================== */}

          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]/evidencias",

                params: {
                  id,
                },
              })
            }
          >
            <Text
              style={[
                styles.backText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ‹ Evidencias
            </Text>
          </Pressable>

          {/* ====================================================== */}
          {/* EMPRESA */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.companyOverline,
              {
                /*
                 * Conservamos la identidad visual
                 * configurada para la empresa.
                 */
                color: company.branding.primaryColor,
              },
            ]}
          >
            {company.name.toUpperCase()}
          </Text>

          {/* ====================================================== */}
          {/* TÍTULO */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.overline,
              {
                color: colors.primary,
              },
            ]}
          >
            EVIDENCIA
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {evidence.title}
          </Text>

          <Text
            style={[
              styles.type,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {evidenceTypeLabel}
          </Text>

          {/* ====================================================== */}
          {/* ESTADO */}
          {/* ====================================================== */}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${evidenceStatusColor}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: evidenceStatusColor,
                },
              ]}
            >
              ● {evidenceStatusLabel}
            </Text>
          </View>

          {/* ====================================================== */}
          {/* CONTENIDO PRINCIPAL RESPONSIVE */}
          {/* ====================================================== */}

          {/*
           * MÓVIL / TABLET
           *
           * ┌─────────────────┐
           * │ Vista previa    │
           * └─────────────────┘
           * ┌─────────────────┐
           * │ Información     │
           * └─────────────────┘
           *
           * DESKTOP
           *
           * ┌────────────────────┬──────────────────┐
           * │ Vista previa       │ Información      │
           * │                    │                  │
           * └────────────────────┴──────────────────┘
           */}
          <View
            style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}
          >
            {/* ================================================== */}
            {/* VISTA PREVIA */}
            {/* ================================================== */}

            <View
              style={[
                styles.previewColumn,

                isDesktop && styles.previewColumnDesktop,
              ]}
            >
              <View
                style={[
                  styles.preview,
                  {
                    backgroundColor: colors.surfaceSecondary,

                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.previewIconContainer,
                    {
                      backgroundColor: colors.primarySoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewIcon,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {evidence.type === "photo" ? "▧" : "▤"}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.previewTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {evidence.type === "photo"
                    ? "Vista previa de fotografía"
                    : "Vista previa del documento"}
                </Text>

                <Text
                  style={[
                    styles.previewDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {evidence.remoteUri || evidence.localUri
                    ? "El archivo asociado será mostrado aquí."
                    : "Este prototipo todavía no contiene el archivo físico asociado."}
                </Text>
              </View>
            </View>

            {/* ================================================== */}
            {/* INFORMACIÓN */}
            {/* ================================================== */}

            <View
              style={[
                styles.informationColumn,

                isDesktop && styles.informationColumnDesktop,
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Información
              </Text>

              <AppCard>
                <InfoRow label="Empresa" value={company.name} />

                <Divider />

                <InfoRow
                  label="Inmueble"
                  value={property?.name ?? "No disponible"}
                />

                <Divider />

                <InfoRow
                  label="Inspección"
                  value={form?.title ?? "No disponible"}
                />

                <Divider />

                <InfoRow label="Tipo" value={evidenceTypeLabel} />

                <Divider />

                <InfoRow label="Fecha" value={formatDate(evidence.date)} />

                <Divider />

                <InfoRow
                  label="Estado"
                  value={evidenceStatusLabel}
                  valueColor={evidenceStatusColor}
                />
              </AppCard>
            </View>
          </View>

          {/* ====================================================== */}
          {/* CONTENIDO SECUNDARIO */}
          {/* ====================================================== */}

          {/*
           * En escritorio también podemos aprovechar
           * el ancho para colocar descripción e
           * inspección relacionada lado a lado.
           *
           * En móvil/tablet continúan verticalmente.
           */}
          <View
            style={[
              styles.secondaryLayout,

              isDesktop && styles.secondaryLayoutDesktop,
            ]}
          >
            {/* ================================================== */}
            {/* DESCRIPCIÓN */}
            {/* ================================================== */}

            {evidence.description && (
              <View
                style={[
                  styles.secondaryColumn,

                  isDesktop && styles.secondaryColumnDesktop,
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Descripción
                </Text>

                <AppCard style={styles.secondaryCard}>
                  <Text
                    style={[
                      styles.description,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {evidence.description}
                  </Text>
                </AppCard>
              </View>
            )}

            {/* ================================================== */}
            {/* INSPECCIÓN RELACIONADA */}
            {/* ================================================== */}

            {inspection && (
              <View
                style={[
                  styles.secondaryColumn,

                  isDesktop && styles.secondaryColumnDesktop,
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Inspección relacionada
                </Text>

                <Pressable
                  onPress={() =>
                    router.navigate({
                      pathname: "/empresas/[id]/inspecciones/[inspectionId]",

                      params: {
                        id,

                        inspectionId: inspection.id,
                      },
                    })
                  }
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppCard style={styles.secondaryCard}>
                    <View style={styles.relatedInspection}>
                      <View
                        style={[
                          styles.relatedIcon,
                          {
                            backgroundColor: colors.primarySoft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.relatedIconText,
                            {
                              color: colors.primary,
                            },
                          ]}
                        >
                          ✓
                        </Text>
                      </View>

                      <View style={styles.relatedInfo}>
                        <Text
                          style={[
                            styles.relatedTitle,
                            {
                              color: colors.text,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {form?.title ?? "Inspección"}
                        </Text>

                        <Text
                          style={[
                            styles.relatedDescription,
                            {
                              color: colors.textSecondary,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {property?.name ?? "Inmueble no disponible"}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.arrow,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        ›
                      </Text>
                    </View>
                  </AppCard>
                </Pressable>
              </View>
            )}
          </View>

          {/* ====================================================== */}
          {/* ACCIONES */}
          {/* ====================================================== */}

          <View style={styles.actions}>
            {/*
             * Estos botones se mantienen visualmente preparados.
             *
             * El archivo original todavía no implementaba
             * la apertura o compartición física del archivo.
             */}
            <View style={styles.actionButton}>
              <AppButton variant="secondary">Abrir archivo</AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton variant="ghost">Compartir</AppButton>
            </View>
          </View>

          {/* ====================================================== */}
          {/* AVISO DEL PROTOTIPO */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.prototypeNotice,
              {
                color: colors.textMuted,
              },
            ]}
          >
            El almacenamiento y apertura real del archivo se implementarán en
            una etapa posterior.
          </Text>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  INFO ROW                                  */
/* -------------------------------------------------------------------------- */

/*
 * Componente reutilizable para mostrar:
 *
 * Etiqueta
 * Valor
 *
 * dentro de la tarjeta de información.
 */
function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text
        style={[
          styles.infoLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          {
            color: valueColor ?? colors.text,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  DIVIDER                                   */
/* -------------------------------------------------------------------------- */

function Divider() {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.divider,
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/*
 * Soporta tanto:
 *
 * 2026-08-20
 *
 * como:
 *
 * 2026-08-20T12:30:00
 *
 * y devuelve:
 *
 * 20/08/2026
 */
function formatDate(date: string) {
  const normalizedDate = date.includes("T") ? date.split("T")[0] : date;

  const parts = normalizedDate.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * ResponsiveContainer se encarga del
   * padding horizontal y superior.
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",

    marginBottom: Spacing.lg,
  },

  companyOverline: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    letterSpacing: 1,

    marginBottom: Spacing.md,
  },

  overline: {
    fontSize: FontSize.caption,

    fontWeight: "700",

    letterSpacing: 1,

    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: FontSize.h1,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  type: {
    fontSize: FontSize.small,

    marginBottom: Spacing.md,
  },

  statusBadge: {
    alignSelf: "flex-start",

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm,

    borderRadius: Radius.full,

    marginBottom: Spacing.xl,
  },

  statusText: {
    fontSize: FontSize.caption,

    fontWeight: "700",
  },

  /*
   * Móvil y tablet:
   * preview e información se mantienen verticales.
   */
  mainLayout: {
    width: "100%",

    gap: Spacing.xl,

    marginBottom: Spacing.xl,
  },

  /*
   * Desktop:
   * cambia a distribución horizontal.
   */
  mainLayoutDesktop: {
    flexDirection: "row",

    alignItems: "stretch",
  },

  previewColumn: {
    width: "100%",
  },

  previewColumnDesktop: {
    flex: 3,
    width: "auto",
    minWidth: 0,
  },

  informationColumn: {
    width: "100%",
  },

  informationColumnDesktop: {
    flex: 2,
    width: "auto",
    minWidth: 0,
  },

  /*
   * La vista previa mantiene una altura
   * suficientemente grande para que más adelante
   * podamos mostrar fotografías/documentos reales.
   */
  preview: {
    minHeight: 300,

    borderWidth: 1,

    borderRadius: Radius.lg,

    alignItems: "center",

    justifyContent: "center",

    padding: Spacing.xl,
  },

  previewIconContainer: {
    width: 72,
    height: 72,

    borderRadius: Radius.lg,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: Spacing.md,
  },

  previewIcon: {
    fontSize: 38,

    fontWeight: "600",
  },

  previewTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    textAlign: "center",

    marginBottom: Spacing.sm,
  },

  previewDescription: {
    maxWidth: 420,

    fontSize: FontSize.small,

    lineHeight: 20,

    textAlign: "center",
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  infoLabel: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  infoValue: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  /*
   * Segundo bloque responsive:
   *
   * Móvil/tablet → vertical
   * Desktop      → horizontal
   */
  secondaryLayout: {
    width: "100%",

    gap: Spacing.xl,

    marginBottom: Spacing.xl,
  },

  secondaryLayoutDesktop: {
    flexDirection: "row",

    alignItems: "stretch",
  },

  secondaryColumn: {
    width: "100%",
  },

  secondaryColumnDesktop: {
    flex: 1,
    width: "auto",
    minWidth: 0,
  },

  /*
   * Ayuda a mantener una apariencia similar
   * cuando descripción e inspección aparecen
   * una al lado de la otra.
   */
  secondaryCard: {
    minHeight: 110,
  },

  description: {
    fontSize: FontSize.small,

    lineHeight: 21,
  },

  relatedInspection: {
    flexDirection: "row",

    alignItems: "center",
  },

  relatedIcon: {
    width: 48,
    height: 48,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  relatedIconText: {
    fontSize: FontSize.h3,

    fontWeight: "700",
  },

  relatedInfo: {
    flex: 1,
    minWidth: 0,
  },

  relatedTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  relatedDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  arrow: {
    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  /*
   * Los botones pueden pasar de una fila a otra
   * cuando no existe espacio suficiente.
   */
  actions: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: Spacing.sm,
  },

  /*
   * Evita botones demasiado estrechos.
   */
  actionButton: {
    flexGrow: 1,

    minWidth: 220,
  },

  prototypeNotice: {
    fontSize: FontSize.caption,

    lineHeight: 18,

    textAlign: "center",

    marginTop: Spacing.lg,
  },

  notFound: {
    flex: 1,

    justifyContent: "center",
  },

  notFoundTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  notFoundDescription: {
    fontSize: FontSize.body,

    lineHeight: 24,
  },
});
