import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidencesByCompanyId } from "@/data/evidences";
import { getFormById } from "@/data/forms";
import { getInspectionById } from "@/data/inspections";
import { getPropertyById } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CompanyEvidencesScreen() {
  /*
   * Recupera los colores correspondientes al tema actual.
   * De esta manera la pantalla continúa funcionando
   * correctamente en modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Obtiene el ID dinámico de la empresa desde:
   *
   * /empresas/[id]/evidencias
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Recuperamos la empresa desde nuestra
   * capa centralizada de datos.
   */
  const company = getCompanyById(id);

  /*
   * Estado de seguridad para evitar que una ruta
   * con un ID inexistente rompa la pantalla.
   */
  if (!company) {
    return (
      <Screen>
        <Pressable onPress={() => router.navigate("/empresas")}>
          <Text
            style={{
              color: colors.primary,
              fontWeight: "600",
            }}
          >
            ‹ Empresas
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
            Empresa no encontrada
          </Text>
        </View>
      </Screen>
    );
  }

  /*
   * Recuperamos solamente las evidencias
   * pertenecientes a esta empresa.
   */
  const companyEvidences = getEvidencesByCompanyId(company.id);

  /*
   * Calculamos los contadores directamente
   * desde los datos.
   *
   * Esto evita tener números escritos
   * manualmente en la interfaz.
   */
  const photoCount = companyEvidences.filter(
    (evidence) => evidence.type === "photo",
  ).length;

  const documentCount = companyEvidences.filter(
    (evidence) => evidence.type === "document",
  ).length;

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
         * - centrado del contenido
         *
         * Así la pantalla no necesita calcular
         * manualmente sus márgenes según dispositivo.
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* NAVEGACIÓN */}
          {/* ====================================================== */}

          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/empresas/[id]",

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
              ‹ Empresa
            </Text>
          </Pressable>

          {/* ====================================================== */}
          {/* EMPRESA */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.overline,
              {
                /*
                 * Utilizamos el color representativo
                 * configurado para cada empresa.
                 */
                color: company.branding.primaryColor,
              },
            ]}
          >
            {company.name.toUpperCase()}
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Evidencias
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Fotografías y documentos recopilados durante las inspecciones.
          </Text>

          {/* ====================================================== */}
          {/* RESUMEN */}
          {/* ====================================================== */}

          {/*
           * Como tenemos exactamente tres indicadores,
           * conservamos tres columnas en todos los tamaños.
           *
           * Total | Fotografías | Documentos
           */}
          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
            <SummaryCard
              value={companyEvidences.length.toString()}
              label="Total"
            />

            <SummaryCard value={photoCount.toString()} label="Fotografías" />

            <SummaryCard value={documentCount.toString()} label="Documentos" />
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* ARCHIVOS */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Archivos
          </Text>

          {/*
           * El listado ahora utiliza nuestro sistema
           * responsive global:
           *
           * Móvil   → 1 evidencia por fila
           * Tablet  → 2 evidencias por fila
           * Desktop → 3 evidencias por fila
           */}
          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {companyEvidences.map((evidence) => {
              /*
               * Una evidencia pertenece a una inspección.
               *
               * Primero resolvemos la inspección para
               * después conocer inmueble y formulario.
               *
               * Evidence
               *    ↓
               * Inspection
               *    ├── Property
               *    └── Form
               */
              const inspection = getInspectionById(evidence.inspectionId);

              const property = inspection
                ? getPropertyById(inspection.propertyId)
                : undefined;

              const form = inspection
                ? getFormById(inspection.formId)
                : undefined;

              return (
                <EvidenceCard
                  key={evidence.id}
                  companyRouteId={id}
                  evidenceId={evidence.id}
                  title={evidence.title}
                  type={evidence.type}
                  date={evidence.date}
                  property={property?.name ?? "Inmueble no disponible"}
                  form={form?.title ?? "Formulario no disponible"}
                />
              );
            })}
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* ESTADO VACÍO */}
          {/* ====================================================== */}

          {companyEvidences.length === 0 && (
            <AppCard style={styles.emptyCard}>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Sin evidencias
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Todavía no existen fotografías o documentos asociados a las
                inspecciones de esta empresa.
              </Text>
            </AppCard>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SUMMARY CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta reutilizable utilizada para los
 * indicadores superiores.
 */
function SummaryCard({ value, label }: { value: string; label: string }) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,
          {
            color: colors.text,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.summaryLabel,
          {
            color: colors.textSecondary,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AppCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                               EVIDENCE CARD                                */
/* -------------------------------------------------------------------------- */

/*
 * Representa una evidencia dentro del listado.
 *
 * Recibe todos sus datos ya preparados para mantener
 * este componente separado de la capa de datos.
 */
function EvidenceCard({
  companyRouteId,
  evidenceId,
  title,
  type,
  date,
  property,
  form,
}: {
  companyRouteId: string;
  evidenceId: string;
  title: string;
  type: "photo" | "document";
  date: string;
  property: string;
  form: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/evidencias/[evidenceId]",

          /*
           * Para abrir una evidencia necesitamos
           * conservar empresa + evidencia.
           */
          params: {
            id: companyRouteId,
            evidenceId,
          },
        })
      }
      style={({ pressed }) => ({
        /*
         * Feedback visual al tocar o presionar
         * la tarjeta.
         */
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard style={styles.evidenceCard}>
        {/* CABECERA DEL ARCHIVO */}

        <View style={styles.cardHeader}>
          <View
            style={[
              styles.fileIcon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.fileIconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              {type === "photo" ? "▧" : "▤"}
            </Text>
          </View>

          <View style={styles.fileInfo}>
            <Text
              style={[
                styles.fileName,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.fileType,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {type === "photo" ? "Imagen" : "Documento"}
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

        {/* DIVISOR */}

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.divider,
            },
          ]}
        />

        {/* INFORMACIÓN RELACIONADA */}

        <View style={styles.metadata}>
          <MetadataRow label="Inmueble" value={property} />

          <MetadataRow label="Formulario" value={form} />

          <MetadataRow label="Fecha" value={formatDate(date)} />
        </View>
      </AppCard>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                               METADATA ROW                                 */
/* -------------------------------------------------------------------------- */

/*
 * Fila reutilizable para mostrar metadatos.
 *
 * Ejemplo:
 *
 * Inmueble     Sucursal Centro
 */
function MetadataRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.metadataRow}>
      <Text
        style={[
          styles.metadataLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.metadataValue,
          {
            color: colors.textSecondary,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/*
 * Las evidencias pueden recibir fechas simples:
 *
 * 2026-08-20
 *
 * o timestamps:
 *
 * 2026-08-20T12:30:00
 *
 * Primero normalizamos el valor y después
 * lo convertimos a DD/MM/YYYY.
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

  subtitle: {
    fontSize: FontSize.body,

    lineHeight: 24,

    marginBottom: Spacing.xl,
  },

  /*
   * ResponsiveGrid determina el ancho.
   * La tarjeta simplemente ocupa todo
   * el espacio asignado.
   */
  summaryCard: {
    width: "100%",

    minHeight: 100,
  },

  summaryValue: {
    fontSize: FontSize.h2,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  summaryLabel: {
    fontSize: FontSize.caption,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginTop: Spacing.xl,

    marginBottom: Spacing.md,
  },

  /*
   * Altura mínima para mantener una apariencia
   * más uniforme cuando aparecen varias
   * evidencias en la misma fila.
   */
  evidenceCard: {
    width: "100%",

    minHeight: 220,
  },

  cardHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  fileIcon: {
    width: 48,
    height: 48,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  fileIconText: {
    fontSize: FontSize.h3,

    fontWeight: "700",
  },

  fileInfo: {
    flex: 1,

    /*
     * Importante para permitir que textos
     * largos se reduzcan correctamente
     * dentro de tarjetas estrechas.
     */
    minWidth: 0,
  },

  fileName: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  fileType: {
    fontSize: FontSize.caption,
  },

  arrow: {
    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  metadata: {
    gap: Spacing.sm,
  },

  metadataRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    gap: Spacing.md,
  },

  metadataLabel: {
    flexShrink: 0,

    fontSize: FontSize.caption,
  },

  metadataValue: {
    flex: 1,
    minWidth: 0,

    textAlign: "right",

    fontSize: FontSize.caption,

    fontWeight: "500",
  },

  emptyCard: {
    marginTop: Spacing.md,
  },

  emptyTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  emptyDescription: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  notFound: {
    flex: 1,

    justifyContent: "center",
  },

  notFoundTitle: {
    fontSize: FontSize.h2,

    fontWeight: "700",
  },
});
