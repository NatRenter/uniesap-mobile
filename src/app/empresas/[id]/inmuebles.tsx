import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

const properties = [
  {
    id: "1",
    name: "Sucursal San Luis de la Paz",
    address: "San Luis de la Paz, Guanajuato",
    type: "Sucursal comercial",
    inspections: 6,
    pending: 1,
  },

  {
    id: "2",
    name: "Sucursal Centro",
    address: "Dolores Hidalgo, Guanajuato",
    type: "Sucursal comercial",
    inspections: 4,
    pending: 0,
  },

  {
    id: "3",
    name: "Centro de distribución",
    address: "San José Iturbide, Guanajuato",
    type: "Centro de distribución",
    inspections: 2,
    pending: 1,
  },
];

export default function CompanyPropertiesScreen() {
  const { colors } = useAppTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

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
          {properties.map((property) => (
            <PropertyCard key={property.id} {...property} companyId={id} />
          ))}
        </View>
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
            {pending > 0 ? `${pending} pendiente` : "Sin pendientes"}
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
});
