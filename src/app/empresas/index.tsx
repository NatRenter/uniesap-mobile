import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const companies = [
  {
    id: "1",
    name: "AutoZone",
    location: "San Luis de la Paz, Guanajuato",
    properties: 3,
    inspections: 12,
    color: "#F97316",
    initials: "AZ",
  },

  {
    id: "2",
    name: "LALA",
    location: "La Piedad, Michoacán",
    properties: 1,
    inspections: 8,
    color: "#EF4444",
    initials: "LA",
  },

  {
    id: "3",
    name: "Empresa Demo",
    location: "León, Guanajuato",
    properties: 2,
    inspections: 5,
    color: "#3B82F6",
    initials: "ED",
  },
];

export default function CompaniesScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              onPress={() => router.navigate("/dashboard")}
              style={styles.backButton}
            >
              <Text
                style={[
                  styles.backText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ‹ Dashboard
              </Text>
            </Pressable>

            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Empresas
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Administra las empresas registradas en UNIESAP.
            </Text>
          </View>

          {/* ACCIÓN PRINCIPAL */}

          <View style={styles.mainAction}>
            <AppButton onPress={() => router.navigate("/empresas/nueva")}>
              + Registrar empresa
            </AppButton>
          </View>

          {/* LISTADO RESPONSIVE */}

          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {companies.map((company) => (
              <CompanyCard key={company.id} {...company} />
            ))}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

function CompanyCard({
  id,
  name,
  location,
  properties,
  inspections,
  color,
  initials,
}: {
  id: string;
  name: string;
  location: string;
  properties: number;
  inspections: number;
  color: string;
  initials: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: "/empresas/[id]",
          params: {
            id,
          },
        })
      }
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppCard padded={false} style={styles.companyCard}>
        <View
          style={[
            styles.accent,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View style={styles.companyContent}>
          <View
            style={[
              styles.companyLogo,
              {
                backgroundColor: `${color}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.initials,
                {
                  color,
                },
              ]}
            >
              {initials}
            </Text>
          </View>

          <View style={styles.companyInformation}>
            <Text
              style={[
                styles.companyName,
                {
                  color: colors.text,
                },
              ]}
            >
              {name}
            </Text>

            <Text
              style={[
                styles.location,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {location}
            </Text>

            <View style={styles.companyStats}>
              <Text
                style={[
                  styles.stat,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {properties} inmuebles
              </Text>

              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.border,
                  },
                ]}
              />

              <Text
                style={[
                  styles.stat,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {inspections} inspecciones
              </Text>
            </View>
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
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  header: {
    marginBottom: Spacing.lg,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
  },

  backText: {
    fontSize: FontSize.small,
    fontWeight: "600",
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

  companyCard: {
    width: "100%",
    overflow: "hidden",
  },

  accent: {
    height: 5,
  },

  companyContent: {
    minHeight: 110,

    flexDirection: "row",
    alignItems: "center",

    padding: Spacing.md,
  },

  companyLogo: {
    width: 52,
    height: 52,

    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,
  },

  initials: {
    fontSize: FontSize.body,
    fontWeight: "700",
  },

  companyInformation: {
    flex: 1,
    minWidth: 0,
  },

  companyName: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  location: {
    fontSize: FontSize.small,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },

  companyStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  stat: {
    fontSize: FontSize.caption,
  },

  dot: {
    width: 4,
    height: 4,

    borderRadius: Radius.full,

    marginHorizontal: Spacing.sm,
  },

  arrow: {
    fontSize: 32,
    marginLeft: Spacing.sm,
  },
});
