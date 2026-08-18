import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getEvidencesByCompanyId } from "@/data/evidences";
import { getInspectionsByCompanyId } from "@/data/inspections";
import { getPropertiesByCompanyId } from "@/data/properties";
import { getReportsByCompanyId } from "@/data/reports";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CompanyDetailsScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const company = getCompanyById(id);

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
   * A partir de aquí ya no usamos números
   * escritos manualmente.
   *
   * Los datos se calculan desde src/data.
   */

  const companyProperties = getPropertiesByCompanyId(company.id);

  const companyInspections = getInspectionsByCompanyId(company.id);

  const companyEvidences = getEvidencesByCompanyId(company.id);

  const companyReports = getReportsByCompanyId(company.id);

  const pendingInspections = companyInspections.filter(
    (inspection) => inspection.status !== "completed",
  ).length;

  const initials = getInitials(company.name);

  const companyLocation = `${company.city}, ${company.state}`;

  const companyColor = company.branding.primaryColor;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* NAVEGACIÓN */}

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
                 * Por ahora conservamos el id
                 * recibido en la ruta.
                 *
                 * Esto mantiene compatibilidad
                 * con las pantallas todavía no
                 * migradas.
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

        {/* IDENTIDAD */}

        <View style={styles.companyHeader}>
          <View
            style={[
              styles.logo,
              {
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

        {/* COLOR EMPRESA */}

        <View
          style={[
            styles.companyColorLine,
            {
              backgroundColor: companyColor,
            },
          ]}
        />

        {/* RESUMEN */}

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

        <View style={styles.statsGrid}>
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
        </View>

        {/* ACCIÓN PRINCIPAL */}

        <View style={styles.mainAction}>
          <AppButton>+ Nueva inspección</AppButton>
        </View>

        {/* MÓDULOS */}

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

        <View style={styles.modules}>
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
        </View>

        {/* INFORMACIÓN */}

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
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SUBCOMPONENTES                                */
/* -------------------------------------------------------------------------- */

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
      >
        {label}
      </Text>
    </AppCard>
  );
}

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
        >
          {description}
        </Text>
      </View>

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
  container: {
    padding: Spacing.lg,
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

  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  summaryCard: {
    flex: 1,
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
    marginBottom: Spacing.xl,
  },

  modules: {
    gap: Spacing.sm,
  },

  moduleCard: {
    minHeight: 82,

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
  },

  moduleTitle: {
    fontSize: FontSize.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },

  moduleDescription: {
    fontSize: FontSize.caption,
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
