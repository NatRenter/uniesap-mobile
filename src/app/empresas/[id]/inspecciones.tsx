import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";

import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/repositories/companyRepository";
import { getFormById } from "@/repositories/formRepository";
import { getInspectionsByCompanyId } from "@/repositories/inspectionRepository";
import { getPropertyById } from "@/repositories/propertyRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import { formatDate } from "@/utils/dateUtils";

export default function CompanyInspectionsScreen() {
  /*
   * Obtiene los colores del tema actual.
   *
   * Esto mantiene automáticamente compatibilidad
   * con modo claro y oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Recupera el ID dinámico de la empresa:
   *
   * /empresas/[id]/inspecciones
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Recuperamos la empresa desde la capa
   * centralizada de datos.
   */
  const company = getCompanyById(id);

  /*
   * Si el ID no corresponde a una empresa
   * existente mostramos un estado controlado.
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
   * Recuperamos únicamente las inspecciones
   * que pertenecen a la empresa actual.
   */
  const companyInspections = getInspectionsByCompanyId(company.id);

  /*
   * Calculamos los contadores del resumen
   * directamente desde los datos.
   *
   * Así evitamos mantener números escritos
   * manualmente dentro de la interfaz.
   */
  const completed = companyInspections.filter(
    (inspection) => inspection.status === "completed",
  ).length;

  const inProgress = companyInspections.filter(
    (inspection) => inspection.status === "in_progress",
  ).length;

  const drafts = companyInspections.filter(
    (inspection) => inspection.status === "draft",
  ).length;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * ResponsiveContainer controla globalmente:
         *
         * - espacio superior
         * - padding horizontal
         * - ancho máximo
         * - centrado en tablet y web
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* NAVEGACIÓN CONTEXTUAL */}
          {/* ====================================================== */}

          <ContextHeader
            /*
             * Inspecciones pertenece al contexto de la empresa.
             */
            backLabel={company.name}
            onBack={() =>
              router.navigate({
                pathname: "/empresas/[id]",

                params: {
                  id,
                },
              })
            }
            /*
             * El nombre y color de la empresa permanecen visibles.
             */
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}
            title="Inspecciones"
            subtitle="Consulta el historial de capturas realizadas para esta empresa."
          />

          {/* ====================================================== */}
          {/* RESUMEN */}
          {/* ====================================================== */}

          {/*
           * Tenemos exactamente tres estados principales,
           * por lo que mantenemos tres tarjetas en todos
           * los tamaños.
           */}
          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
            <SummaryCard value={completed.toString()} label="Finalizadas" />

            <SummaryCard
              value={inProgress.toString()}
              label="En proceso"
              warning={inProgress > 0}
            />

            <SummaryCard value={drafts.toString()} label="Borradores" />
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* HISTORIAL */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Historial
          </Text>

          {/*
           * ResponsiveGrid reemplaza la lista vertical fija.
           *
           * Móvil   → 1 inspección por fila
           * Tablet  → 2 inspecciones por fila
           * Desktop → 3 inspecciones por fila
           */}
          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {companyInspections.map((inspection) => {
              /*
               * Cada inspección solamente almacena IDs.
               *
               * Aquí resolvemos:
               *
               * propertyId → nombre del inmueble
               * formId     → nombre del formulario
               */
              const property = getPropertyById(inspection.propertyId);

              const form = getFormById(inspection.formId);

              return (
                <InspectionCard
                  key={inspection.id}
                  inspectionId={inspection.id}
                  companyRouteId={id}
                  form={form?.title ?? "Formulario no disponible"}
                  property={property?.name ?? "Inmueble no disponible"}
                  date={inspection.date}
                  inspector={inspection.inspector}
                  status={inspection.status}
                />
              );
            })}
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* ESTADO VACÍO */}
          {/* ====================================================== */}

          {companyInspections.length === 0 && (
            <AppCard style={styles.emptyCard}>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Sin inspecciones
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Todavía no existen inspecciones registradas para esta empresa.
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
 * Tarjeta pequeña utilizada para mostrar
 * los contadores principales.
 *
 * warning permite resaltar valores
 * que requieren atención.
 */
function SummaryCard({
  value,
  label,
  warning = false,
}: {
  value: string;
  label: string;
  warning?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.summaryCard}>
      <Text
        style={[
          styles.summaryValue,
          {
            color: warning ? colors.warning : colors.text,
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
/*                              INSPECTION CARD                               */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta que representa una inspección.
 *
 * Recibe la información ya resuelta para que
 * el componente no tenga que consultar
 * directamente la capa de datos.
 */
function InspectionCard({
  inspectionId,
  companyRouteId,
  form,
  property,
  date,
  inspector,
  status,
}: {
  inspectionId: string;
  companyRouteId: string;
  form: string;
  property: string;
  date: string;
  inspector: string;

  status: "draft" | "in_progress" | "completed";
}) {
  const { colors } = useAppTheme();

  /*
   * Traducimos el estado interno a una
   * etiqueta entendible para el usuario.
   */
  const statusLabel =
    status === "completed"
      ? "Finalizada"
      : status === "in_progress"
        ? "En proceso"
        : "Borrador";

  /*
   * El color también depende del estado:
   *
   * completed   → verde
   * in_progress → advertencia
   * draft       → neutro
   */
  const statusColor =
    status === "completed"
      ? colors.success
      : status === "in_progress"
        ? colors.warning
        : colors.textMuted;

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/inspecciones/[inspectionId]",

          /*
           * Para abrir el detalle necesitamos
           * conservar empresa + inspección.
           */
          params: {
            id: companyRouteId,
            inspectionId,
          },
        })
      }
      style={({ pressed }) => ({
        /*
         * Feedback visual al tocar la tarjeta.
         */
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard style={styles.inspectionCard}>
        {/* CABECERA */}

        <View style={styles.cardHeader}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.iconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ✓
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text
              style={[
                styles.formTitle,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={2}
            >
              {form}
            </Text>

            <Text
              style={[
                styles.property,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {property}
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

        {/* METADATOS */}

        <View style={styles.meta}>
          <View style={styles.metaInformation}>
            <Text
              style={[
                styles.metaText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {formatDate(date)}
            </Text>

            <Text
              style={[
                styles.inspector,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              Inspector: {inspector}
            </Text>
          </View>

          <Text
            style={[
              styles.status,
              {
                color: statusColor,
              },
            ]}
          >
            ● {statusLabel}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                UTILIDADES                                  */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * ResponsiveContainer ya controla
   * padding horizontal y superior.
   *
   * Aquí solamente necesitamos espacio
   * inferior para el ScrollView.
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
   * El ancho de SummaryCard lo determina
   * ResponsiveGrid.
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
   * Cada tarjeta ocupa siempre el 100%
   * del espacio que ResponsiveGrid le asigna.
   */
  inspectionCard: {
    width: "100%",

    /*
     * Mantiene una altura mínima razonable.
     * Esto ayuda a que las filas se vean más
     * uniformes en tablet y escritorio.
     */
    minHeight: 190,
  },

  cardHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  icon: {
    width: 48,
    height: 48,

    borderRadius: Radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,
  },

  iconText: {
    fontSize: FontSize.h3,

    fontWeight: "700",
  },

  /*
   * minWidth: 0 es importante dentro de
   * layouts flex porque permite que Text
   * se reduzca correctamente en tarjetas
   * más estrechas.
   */
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },

  formTitle: {
    fontSize: FontSize.body,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  property: {
    fontSize: FontSize.small,

    lineHeight: 20,
  },

  arrow: {
    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  divider: {
    height: 1,

    marginVertical: Spacing.md,
  },

  meta: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    gap: Spacing.md,
  },

  metaInformation: {
    flex: 1,
    minWidth: 0,
  },

  metaText: {
    fontSize: FontSize.caption,

    marginBottom: Spacing.xs,
  },

  inspector: {
    fontSize: FontSize.caption,
  },

  status: {
    flexShrink: 0,

    fontSize: FontSize.caption,

    fontWeight: "700",
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
