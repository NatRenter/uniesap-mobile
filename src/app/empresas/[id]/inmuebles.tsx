import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { ContextHeader } from "@/components/navigation/ContextHeader";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getInspectionsByPropertyId } from "@/data/inspections";
import { getPropertiesByCompanyId } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CompanyPropertiesScreen() {
  /*
   * Recupera los colores del tema actual.
   * Esto mantiene la pantalla compatible con
   * modo claro y modo oscuro.
   */
  const { colors } = useAppTheme();

  /*
   * Obtiene el ID dinámico de la empresa desde la ruta:
   *
   * /empresas/[id]/inmuebles
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Busca la empresa correspondiente en la capa central de datos.
   */
  const company = getCompanyById(id);

  /*
   * Si el ID no corresponde a una empresa existente,
   * mostramos una pantalla controlada.
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
   * Recuperamos únicamente los inmuebles
   * pertenecientes a la empresa actual.
   */
  const companyProperties = getPropertiesByCompanyId(company.id);

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
         * - centrado en tablet y web
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* ENCABEZADO                                             */}
          {/* ====================================================== */}
          {/* ====================================================== */}
          {/* NAVEGACIÓN CONTEXTUAL                                  */}
          {/* ====================================================== */}

          <ContextHeader
            /*
             * El nivel anterior de "Inmuebles"
             * es el detalle de la empresa.
             *
             * Mostramos el nombre real para que el usuario
             * sepa exactamente a dónde regresará.
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
             * Conservamos visible el contexto de empresa.
             */
            contextLabel={company.name}
            contextColor={company.branding.primaryColor}
            /*
             * Información propia de esta pantalla.
             */
            title="Inmuebles"
            subtitle="Sucursales, centros de trabajo e instalaciones asociadas a esta empresa."
          />

          {/* ====================================================== */}
          {/* ACCIÓN PRINCIPAL */}
          {/* ====================================================== */}

          <View style={styles.mainAction}>
            <AppButton
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/inmuebles/nuevo",

                  params: {
                    id,
                  },
                })
              }
            >
              + Registrar inmueble
            </AppButton>
          </View>

          {/* ====================================================== */}
          {/* LISTADO DE INMUEBLES */}
          {/* ====================================================== */}

          {/*
           * ResponsiveGrid adapta automáticamente
           * la cantidad de tarjetas por fila:
           *
           * móvil   → 1 columna
           * tablet  → 2 columnas
           * desktop → 3 columnas
           */}
          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {companyProperties.map((property) => {
              /*
               * Calculamos las inspecciones de cada inmueble.
               * Así cada tarjeta refleja datos reales del modelo.
               */
              const propertyInspections = getInspectionsByPropertyId(
                property.id,
              );

              /*
               * Contamos como pendientes todas aquellas
               * inspecciones que aún no estén completadas.
               */
              const pending = propertyInspections.filter(
                (inspection) => inspection.status !== "completed",
              ).length;

              return (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  name={property.name}
                  address={`${property.city}, ${property.state}`}
                  type={property.type}
                  inspections={propertyInspections.length}
                  pending={pending}
                  companyId={id}
                />
              );
            })}
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* ESTADO VACÍO */}
          {/* ====================================================== */}

          {companyProperties.length === 0 && (
            <AppCard style={styles.emptyCard}>
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                No hay inmuebles registrados
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Registra el primer inmueble asociado a esta empresa.
              </Text>
            </AppCard>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PROPERTY CARD                                 */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta reutilizable para representar un inmueble.
 *
 * La tarjeta no conoce la lógica de búsqueda de datos;
 * únicamente recibe la información ya preparada.
 */
function PropertyCard({
  id,
  name,
  address,
  type,
  inspections,
  pending,
  companyId,
}: {
  id: string;
  name: string;
  address: string;
  type: string;
  inspections: number;
  pending: number;
  companyId: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]/inmuebles/[propertyId]",

          /*
           * Enviamos tanto el ID de empresa
           * como el ID del inmueble.
           */
          params: {
            id: companyId,
            propertyId: id,
          },
        })
      }
      style={({ pressed }) => ({
        /*
         * Feedback visual para móvil,
         * tablet y mouse en web.
         */
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard style={styles.propertyCard}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.propertyIcon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text
              style={[
                styles.propertyIconText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ⌂
            </Text>
          </View>

          <View style={styles.propertyInfo}>
            <Text
              style={[
                styles.propertyName,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={2}
            >
              {name}
            </Text>

            <Text
              style={[
                styles.propertyAddress,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {address}
            </Text>

            <Text
              style={[
                styles.propertyType,
                {
                  color: colors.textMuted,
                },
              ]}
              numberOfLines={1}
            >
              {type}
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

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.divider,
            },
          ]}
        />

        {/* RESUMEN DEL INMUEBLE */}

        <View style={styles.stats}>
          <Text
            style={[
              styles.stat,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {inspections} inspecciones
          </Text>

          <Text
            style={[
              styles.stat,
              {
                color: pending > 0 ? colors.warning : colors.success,
              },
            ]}
          >
            {pending > 0
              ? `${pending} pendiente${pending > 1 ? "s" : ""}`
              : "Sin pendientes"}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * El ScrollView únicamente conserva
   * padding inferior.
   *
   * El padding horizontal y superior
   * ahora pertenecen a ResponsiveContainer.
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  header: {
    marginBottom: Spacing.lg,
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
  },

  mainAction: {
    marginBottom: Spacing.lg,
  },

  /*
   * ResponsiveGrid controla el ancho
   * de cada PropertyCard.
   *
   * Por eso la tarjeta siempre ocupa
   * el 100% del espacio asignado.
   */
  propertyCard: {
    width: "100%",
    minHeight: 180,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  propertyIcon: {
    width: 48,
    height: 48,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  propertyIconText: {
    fontSize: FontSize.h3,
    fontWeight: "600",
  },

  propertyInfo: {
    flex: 1,

    /*
     * Evita desbordamientos cuando la tarjeta
     * se hace más estrecha en tablet.
     */
    minWidth: 0,
  },

  propertyName: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  propertyAddress: {
    fontSize: FontSize.small,
    lineHeight: 20,

    marginBottom: Spacing.xs,
  },

  propertyType: {
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

  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    /*
     * Si una tarjeta queda muy estrecha,
     * permitimos que el contenido se acomode.
     */
    flexWrap: "wrap",

    gap: Spacing.sm,
  },

  stat: {
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
