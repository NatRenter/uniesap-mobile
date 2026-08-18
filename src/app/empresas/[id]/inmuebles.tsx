import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { getCompanyById } from "@/data/companies";
import { getInspectionsByPropertyId } from "@/data/inspections";
import { getPropertiesByCompanyId } from "@/data/properties";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export default function CompanyPropertiesScreen() {
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
        </View>
      </Screen>
    );
  }

  const companyProperties = getPropertiesByCompanyId(company.id);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
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

          <Text
            style={[
              styles.overline,
              {
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
            Inmuebles
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Sucursales, centros de trabajo e instalaciones asociadas a esta
            empresa.
          </Text>
        </View>

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

        <View style={styles.list}>
          {companyProperties.map((property) => {
            const propertyInspections = getInspectionsByPropertyId(property.id);

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
        </View>

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
      </ScrollView>
    </Screen>
  );
}

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
          params: {
            id: companyId,
            propertyId: id,
          },
        })
      }
    >
      <AppCard>
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

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
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

  list: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
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
  },

  propertyName: {
    fontSize: FontSize.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  propertyAddress: {
    fontSize: FontSize.small,
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
  },

  stat: {
    fontSize: FontSize.caption,
    fontWeight: "500",
  },

  emptyCard: {
    marginTop: Spacing.lg,
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
