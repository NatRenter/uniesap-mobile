import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { getEvidencesByCompanyId } from "@/repositories/evidenceRepository";
import { getInspectionsByCompanyId } from "@/repositories/inspectionRepository";
import { getReportsByCompanyId } from "@/data/reports";
import { getCompanyById } from "@/repositories/companyRepository";
import { getPropertiesByCompanyId } from "@/repositories/propertyRepository";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CompanyDetailsScreen() {
  /*
   * useAppTheme centraliza los colores.
   *
   * Esto evita colocar colores de modo claro/oscuro
   * manualmente dentro de cada pantalla.
   */
  const { colors } = useAppTheme();

  /*
   * Expo Router obtiene el parámetro dinámico:
   *
   * /empresas/[id]
   *
   * Ejemplo:
   * /empresas/1
   *
   * id será "1".
   */
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  /*
   * Buscamos la empresa en nuestra capa de datos.
   *
   * La pantalla no necesita conocer directamente
   * cómo se almacenan las empresas.
   */
  const company = getCompanyById(id);

  /*
   * Estado de seguridad:
   * si el ID no corresponde con ninguna empresa,
   * mostramos una pantalla controlada en lugar
   * de dejar que la aplicación falle.
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

          <Text
            style={[
              styles.notFoundDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No fue posible encontrar la información de esta empresa.
          </Text>
        </View>
      </Screen>
    );
  }

  /*
   * RELACIONES DE DATOS
   *
   * Ya no escribimos manualmente:
   *
   * inmuebles: 3
   * inspecciones: 12
   *
   * Cada contador se obtiene de la información
   * relacionada realmente con la empresa.
   */
  const companyProperties = getPropertiesByCompanyId(company.id);

  const companyInspections = getInspectionsByCompanyId(company.id);

  const companyEvidences = getEvidencesByCompanyId(company.id);

  const companyReports = getReportsByCompanyId(company.id);

  /*
   * Una inspección se considera pendiente mientras
   * su estado sea diferente de "completed".
   */
  const pendingInspections = companyInspections.filter(
    (inspection) => inspection.status !== "completed",
  ).length;

  /*
   * Generamos automáticamente las iniciales
   * utilizadas en el avatar de la empresa.
   */
  const initials = getInitials(company.name);

  const companyLocation = `${company.city}, ${company.state}`;

  /*
   * Cada empresa puede conservar su propio
   * color representativo.
   *
   * Ejemplo AutoZone → naranja.
   */
  const companyColor = company.branding.primaryColor;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * RESPONSIVE CONTAINER
         *
         * Controla de manera global:
         *
         * - padding horizontal
         * - margen superior
         * - ancho máximo
         * - centrado del contenido
         *
         * Así no necesitamos hacer cálculos
         * responsive dentro de esta pantalla.
         */}
        <ResponsiveContainer>
          {/* ====================================================== */}
          {/* NAVEGACIÓN */}
          {/* ====================================================== */}

          <View style={styles.topNavigation}>
            <Pressable onPress={() => router.navigate("/empresas")}>
              <Text
                style={[
                  styles.backText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ‹ Empresas
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/editar",

                  /*
                   * Conservamos el ID actual de la empresa
                   * mientras navegamos hacia editar.
                   */
                  params: {
                    id,
                  },
                })
              }
            >
              <Text
                style={[
                  styles.editText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Editar
              </Text>
            </Pressable>
          </View>

          {/* ====================================================== */}
          {/* IDENTIDAD DE EMPRESA */}
          {/* ====================================================== */}

          <View style={styles.companyHeader}>
            <View
              style={[
                styles.logo,
                {
                  /*
                   * Añadimos transparencia al color
                   * representativo para crear el fondo
                   * del avatar.
                   */
                  backgroundColor: `${companyColor}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.logoText,
                  {
                    color: companyColor,
                  },
                ]}
              >
                {initials}
              </Text>
            </View>

            <View style={styles.headerInformation}>
              <Text
                style={[
                  styles.companyName,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {company.name}
              </Text>

              <Text
                style={[
                  styles.companyLocation,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {companyLocation}
              </Text>
            </View>
          </View>

          {/* COLOR REPRESENTATIVO */}

          <View
            style={[
              styles.companyColorLine,
              {
                backgroundColor: companyColor,
              },
            ]}
          />

          {/* ====================================================== */}
          {/* RESUMEN */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Resumen
          </Text>

          {/*
           * RESPONSIVE GRID
           *
           * Móvil:   3 columnas
           * Tablet:  3 columnas
           * Desktop: 3 columnas
           *
           * En este caso mantenemos tres porque
           * solamente tenemos tres indicadores.
           */}
          <ResponsiveGrid
            phoneColumns={3}
            tabletColumns={3}
            desktopColumns={3}
            gap={Spacing.sm}
          >
            <SummaryCard
              value={companyProperties.length.toString()}
              label="Inmuebles"
            />

            <SummaryCard
              value={companyInspections.length.toString()}
              label="Inspecciones"
            />

            <SummaryCard
              value={pendingInspections.toString()}
              label="Pendientes"
              warning={pendingInspections > 0}
            />
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* ACCIÓN PRINCIPAL */}
          {/* ====================================================== */}

          <View style={styles.mainAction}>
            <AppButton
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/inmuebles",

                  params: {
                    id,
                  },
                })
              }
            >
              + Nueva inspección
            </AppButton>
          </View>

          {/* ====================================================== */}
          {/* GESTIÓN */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Gestión
          </Text>

          {/*
           * Aquí empieza la mejora principal para tabletas.
           *
           * Móvil:
           * [ Inmuebles ]
           * [ Inspecciones ]
           * [ Formularios ]
           *
           * Tablet:
           * [ Inmuebles ] [ Inspecciones ]
           * [ Formularios ] [ Evidencias ]
           *
           * Desktop:
           * [ Inmuebles ] [ Inspecciones ] [ Formularios ]
           * [ Evidencias ] [ Reportes ]
           */}
          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            <ModuleCard
              icon="⌂"
              title="Inmuebles"
              description="Sucursales y centros de trabajo"
              count={companyProperties.length}
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/inmuebles",

                  params: {
                    id,
                  },
                })
              }
            />

            <ModuleCard
              icon="✓"
              title="Inspecciones"
              description="Historial y capturas realizadas"
              count={companyInspections.length}
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/inspecciones",

                  params: {
                    id,
                  },
                })
              }
            />

            <ModuleCard
              icon="≡"
              title="Formularios"
              description="Formularios asignados a la empresa"
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/formularios",

                  params: {
                    id,
                  },
                })
              }
            />

            <ModuleCard
              icon="◫"
              title="Evidencias"
              description="Fotografías y documentos"
              count={companyEvidences.length}
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/evidencias",

                  params: {
                    id,
                  },
                })
              }
            />

            <ModuleCard
              icon="▤"
              title="Reportes"
              description="Consulta y genera reportes"
              count={companyReports.length}
              onPress={() =>
                router.navigate({
                  pathname: "/empresas/[id]/reportes",

                  params: {
                    id,
                  },
                })
              }
            />
          </ResponsiveGrid>

          {/* ====================================================== */}
          {/* INFORMACIÓN DE EMPRESA */}
          {/* ====================================================== */}

          <Text
            style={[
              styles.sectionTitle,
              styles.informationTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Información de la empresa
          </Text>

          <AppCard>
            <InformationRow label="Nombre comercial" value={company.name} />

            <Divider />

            <InformationRow label="Razón social" value={company.legalName} />

            {company.rfc && (
              <>
                <Divider />

                <InformationRow label="RFC" value={company.rfc} />
              </>
            )}

            <Divider />

            <InformationRow label="Estado" value={company.state} />

            <Divider />

            <InformationRow label="Municipio" value={company.city} />

            {company.phone && (
              <>
                <Divider />

                <InformationRow label="Teléfono" value={company.phone} />
              </>
            )}

            {company.email && (
              <>
                <Divider />

                <InformationRow label="Correo" value={company.email} />
              </>
            )}

            <Divider />

            {/* Color configurado para esta empresa */}

            <View style={styles.colorInformation}>
              <View>
                <Text
                  style={[
                    styles.infoLabel,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  Color representativo
                </Text>

                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {companyColor}
                </Text>
              </View>

              <View
                style={[
                  styles.colorSample,
                  {
                    backgroundColor: companyColor,
                  },
                ]}
              />
            </View>
          </AppCard>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SUBCOMPONENTES                                */
/* -------------------------------------------------------------------------- */

/*
 * Tarjeta utilizada para los indicadores
 * principales del resumen.
 *
 * warning permite resaltar valores que
 * requieren atención.
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

/*
 * Tarjeta de navegación hacia cada
 * módulo perteneciente a una empresa.
 *
 * Recibe onPress para mantener la tarjeta
 * reutilizable y desacoplada de Expo Router.
 */
function ModuleCard({
  icon,
  title,
  description,
  count,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  count?: number;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleCard,

        {
          backgroundColor: colors.surface,

          borderColor: colors.border,

          /*
           * Retroalimentación visual al tocar
           * la tarjeta en móvil/tablet.
           */
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.moduleIcon,
          {
            backgroundColor: colors.primarySoft,
          },
        ]}
      >
        <Text
          style={[
            styles.moduleIconText,
            {
              color: colors.primary,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={styles.moduleInformation}>
        <Text
          style={[
            styles.moduleTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.moduleDescription,
            {
              color: colors.textSecondary,
            },
          ]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {/*
       * Algunos módulos tienen contador.
       * Como count es opcional, Formularios
       * puede funcionar sin él.
       */}
      {count !== undefined && (
        <View
          style={[
            styles.counter,
            {
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
        >
          <Text
            style={[
              styles.counterText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {count}
          </Text>
        </View>
      )}

      <Text
        style={[
          styles.moduleArrow,
          {
            color: colors.textMuted,
          },
        ]}
      >
        ›
      </Text>
    </Pressable>
  );
}

/*
 * Fila reutilizable para mostrar
 * propiedades de la empresa.
 */
function InformationRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.informationRow}>
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
            color: colors.text,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/*
 * Separador compatible automáticamente
 * con modo claro y oscuro.
 */
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

/*
 * Genera las iniciales utilizadas
 * dentro del avatar.
 *
 * "Empresa Demo" → ED
 * "LALA"         → LA
 */
function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /*
   * Ya NO agregamos padding horizontal aquí.
   *
   * ResponsiveContainer se encarga de:
   * móvil / tablet / desktop.
   */
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  topNavigation: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: Spacing.xl,
  },

  backText: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  editText: {
    fontSize: FontSize.small,

    fontWeight: "600",
  },

  companyHeader: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: Spacing.lg,
  },

  logo: {
    width: 72,
    height: 72,

    borderRadius: Radius.lg,

    justifyContent: "center",

    alignItems: "center",

    marginRight: Spacing.md,
  },

  logoText: {
    fontSize: FontSize.h2,

    fontWeight: "700",
  },

  headerInformation: {
    flex: 1,

    /*
     * Evita problemas de desbordamiento
     * con nombres largos en tablet/web.
     */
    minWidth: 0,
  },

  companyName: {
    fontSize: FontSize.h1,

    fontWeight: "700",

    marginBottom: Spacing.xs,
  },

  companyLocation: {
    fontSize: FontSize.small,
  },

  companyColorLine: {
    height: 6,

    borderRadius: Radius.full,

    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.cardTitle,

    fontWeight: "700",

    marginBottom: Spacing.md,
  },

  /*
   * ResponsiveGrid controla el ancho.
   *
   * Por eso aquí ya no usamos:
   *
   * flex: 1
   *
   * para definir manualmente columnas.
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

  mainAction: {
    marginTop: Spacing.sm,

    marginBottom: Spacing.xl,
  },

  /*
   * Igual que SummaryCard:
   * el ancho pertenece a ResponsiveGrid.
   */
  moduleCard: {
    width: "100%",

    minHeight: 90,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderRadius: Radius.lg,

    padding: Spacing.md,
  },

  moduleIcon: {
    width: 44,
    height: 44,

    borderRadius: Radius.md,

    justifyContent: "center",

    alignItems: "center",

    marginRight: Spacing.md,
  },

  moduleIconText: {
    fontSize: FontSize.h3,

    fontWeight: "600",
  },

  moduleInformation: {
    flex: 1,
    minWidth: 0,
  },

  moduleTitle: {
    fontSize: FontSize.body,

    fontWeight: "600",

    marginBottom: Spacing.xs,
  },

  moduleDescription: {
    fontSize: FontSize.caption,

    lineHeight: 18,
  },

  counter: {
    minWidth: 30,
    height: 30,

    borderRadius: Radius.full,

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: Spacing.sm,

    marginLeft: Spacing.sm,
  },

  counterText: {
    fontSize: FontSize.caption,

    fontWeight: "600",
  },

  moduleArrow: {
    fontSize: 28,

    marginLeft: Spacing.sm,
  },

  informationTitle: {
    marginTop: Spacing.xl,
  },

  informationRow: {
    paddingVertical: Spacing.sm,
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

    marginVertical: Spacing.sm,
  },

  colorInformation: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingVertical: Spacing.sm,
  },

  colorSample: {
    width: 36,
    height: 36,

    borderRadius: Radius.full,
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
