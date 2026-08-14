import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const companies = {
  "1": {
    id: "1",
    name: "AutoZone",
    legalName: "AutoZone de México S. de R.L. de C.V.",
    location: "San Luis de la Paz, Guanajuato",
    state: "Guanajuato",
    city: "San Luis de la Paz",
    color: "#F97316",
    initials: "AZ",
    properties: 3,
    inspections: 12,
    pending: 2,
  },

  "2": {
    id: "2",
    name: "LALA",
    legalName: "Empresa LALA",
    location: "La Piedad, Michoacán",
    state: "Michoacán",
    city: "La Piedad",
    color: "#EF4444",
    initials: "LA",
    properties: 1,
    inspections: 8,
    pending: 1,
  },

  "3": {
    id: "3",
    name: "Empresa Demo",
    legalName: "Empresa Demo S.A. de C.V.",
    location: "León, Guanajuato",
    state: "Guanajuato",
    city: "León",
    color: "#3B82F6",
    initials: "ED",
    properties: 2,
    inspections: 5,
    pending: 0,
  },
} as const;

export default function CompanyDetailsScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const company = companies[id as keyof typeof companies] ?? companies["1"];

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
                backgroundColor: `${company.color}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.logoText,
                {
                  color: company.color,
                },
              ]}
            >
              {company.initials}
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
              {company.location}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.companyColorLine,
            {
              backgroundColor: company.color,
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
            value={company.properties.toString()}
            label="Inmuebles"
          />

          <SummaryCard
            value={company.inspections.toString()}
            label="Inspecciones"
          />

          <SummaryCard
            value={company.pending.toString()}
            label="Pendientes"
            warning={company.pending > 0}
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
            count={company.properties}
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
            count={company.inspections}
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
            description="Resultados y exportaciones"
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

          <Divider />

          <InformationRow label="Estado" value={company.state} />

          <Divider />

          <InformationRow label="Municipio" value={company.city} />

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
                {company.color}
              </Text>
            </View>

            <View
              style={[
                styles.colorSample,
                {
                  backgroundColor: company.color,
                },
              ]}
            />
          </View>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

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
});
