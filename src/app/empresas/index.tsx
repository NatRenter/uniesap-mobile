import { useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { Screen } from "@/components/ui/Screen";

import { FontSize, Radius, Spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import { getCompanies } from "@/repositories/companyRepository";
import { getInspectionsByCompanyId } from "@/repositories/inspectionRepository";
import { getPropertiesByCompanyId } from "@/repositories/propertyRepository";

import {
  getCompanySyncQueueCount,
  processCompanySyncQueue,
  type CompanySyncQueueResult,
} from "@/services/companySyncQueueService";

/*
 * ============================================================================
 * EMPRESA AISLADA PARA FIELD TEST 0.1
 * ============================================================================
 *
 * UUID real de la empresa utilizada para comprobar CREATE y UPDATE.
 *
 * Utilizamos el UUID y no el nombre porque el nombre es información editable.
 * La identidad de sincronización de la empresa debe permanecer estable aunque
 * sus datos de negocio cambien.
 *
 * Este filtro es TEMPORAL y se retirará después de las pruebas controladas.
 */
const FIELD_TEST_COMPANY_ID = "c5a68375-99cf-40d1-8970-20694b582db0";

/*
 * ============================================================================
 * LISTADO DE EMPRESAS
 * ============================================================================
 *
 * Durante Field Test 0.1 esta pantalla incluye herramientas temporales
 * para comprobar la sincronización con UNIESAP API.
 *
 * IMPORTANTE:
 *
 * El botón de prueba procesa exclusivamente FIELD_TEST_COMPANY_ID.
 * Las demás empresas pendientes NO son enviadas al servidor.
 */
export default function CompaniesScreen() {
  const { colors } = useAppTheme();

  /*
   * CompanyRepository todavía no es un store reactivo.
   *
   * Este estado permite volver a renderizar la pantalla después de que
   * SyncService modifique los metadatos de sincronización.
   */
  const [, setRefreshKey] = useState(0);

  /*
   * Estado del botón manual.
   */
  const [isSyncing, setIsSyncing] = useState(false);

  /*
   * Resultado temporal de la última ejecución de la cola.
   */
  const [lastSyncResult, setLastSyncResult] =
    useState<CompanySyncQueueResult | null>(null);

  /*
   * Las consultas normales excluyen tombstones.
   */
  const companies = getCompanies();

  /*
   * Este contador representa la cola GLOBAL.
   *
   * Puede mostrar 10 pendientes aunque el botón de prueba procese
   * exclusivamente una empresa.
   */
  const pendingSyncCount = getCompanySyncQueueCount();

  /*
   * ==========================================================================
   * SINCRONIZACIÓN MANUAL AISLADA
   * ==========================================================================
   *
   * La empresa se identifica mediante su UUID estable.
   *
   * Esto permite modificar nombre, razón social u otros campos sin alterar
   * la identidad utilizada para sincronización.
   */
  async function handleSyncCompanies(): Promise<void> {
    if (isSyncing) {
      return;
    }

    const testCompany = companies.find(
      (company) => company.id === FIELD_TEST_COMPANY_ID,
    );

    if (!testCompany) {
      console.error(
        "No se encontró la empresa configurada para Field Test 0.1:",
        FIELD_TEST_COMPANY_ID,
      );

      return;
    }

    console.log("Preparando sincronización aislada de Company:", {
      companyId: testCompany.id,
      name: testCompany.name,
      status: testCompany.sync.status,
      serverVersion: testCompany.sync.serverVersion,
      operationId: testCompany.sync.operationId,
    });

    setIsSyncing(true);

    try {
      /*
       * Solamente FIELD_TEST_COMPANY_ID puede entrar en esta ejecución.
       *
       * Las demás empresas pending/error/local quedan intactas.
       */
      const result = await processCompanySyncQueue({
        companyIds: [FIELD_TEST_COMPANY_ID],
      });

      setLastSyncResult(result);

      /*
       * El repository todavía no es reactivo.
       *
       * Forzamos el render para visualizar el nuevo estado después de que
       * CompanySyncService persista los metadatos.
       */
      setRefreshKey((current) => current + 1);

      console.log("Sincronización aislada de Field Test finalizada:", result);
    } catch (error) {
      console.error(
        "Error inesperado ejecutando la sincronización aislada:",
        error,
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* ============================================================ */}
          {/* HEADER                                                       */}
          {/* ============================================================ */}

          <View style={styles.header}>
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
              Consulta las empresas registradas y los inmuebles asociados.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* ACCIONES                                                     */}
          {/* ============================================================ */}

          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton onPress={() => router.navigate("/empresas/nueva")}>
                + Registrar empresa
              </AppButton>
            </View>

            <View style={styles.actionButton}>
              <AppButton onPress={handleSyncCompanies} disabled={isSyncing}>
                {isSyncing
                  ? "Sincronizando prueba..."
                  : `Sincronizar prueba (${pendingSyncCount} pendientes)`}
              </AppButton>
            </View>
          </View>

          {/* ============================================================ */}
          {/* DIAGNÓSTICO TEMPORAL                                        */}
          {/* ============================================================ */}

          {lastSyncResult ? (
            <AppCard style={styles.syncResultCard}>
              <Text
                style={[
                  styles.syncResultTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Última sincronización de prueba
              </Text>

              <View style={styles.syncStats}>
                <SyncStat
                  label="Candidatas"
                  value={lastSyncResult.totalCandidates}
                  color={colors.textSecondary}
                />

                <SyncStat
                  label="Sincronizadas"
                  value={lastSyncResult.synced}
                  color={colors.success}
                />

                <SyncStat
                  label="Errores"
                  value={lastSyncResult.failed}
                  color={colors.warning}
                />

                <SyncStat
                  label="Omitidas"
                  value={lastSyncResult.skipped}
                  color={colors.textSecondary}
                />
              </View>
            </AppCard>
          ) : null}

          {/* ============================================================ */}
          {/* EMPRESAS                                                     */}
          {/* ============================================================ */}

          <ResponsiveGrid
            phoneColumns={1}
            tabletColumns={2}
            desktopColumns={3}
            gap={Spacing.md}
          >
            {companies.map((company) => {
              const properties = getPropertiesByCompanyId(company.id);

              const inspections = getInspectionsByCompanyId(company.id);

              const pendingInspections = inspections.filter(
                (inspection) => inspection.status === "draft",
              ).length;

              const inProgressInspections = inspections.filter(
                (inspection) => inspection.status === "in_progress",
              ).length;

              const completedInspections = inspections.filter(
                (inspection) => inspection.status === "completed",
              ).length;

              return (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  properties={properties.length}
                  pendingInspections={pendingInspections}
                  inProgressInspections={inProgressInspections}
                  completedInspections={completedInspections}
                  color={company.branding.primaryColor}
                  initials={createCompanyInitials(company.name)}
                  syncStatus={company.sync.status}
                  serverVersion={company.sync.serverVersion}
                />
              );
            })}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </ScrollView>
    </Screen>
  );
}

/*
 * ============================================================================
 * TARJETA DE EMPRESA
 * ============================================================================
 */
function CompanyCard({
  id,
  name,
  properties,
  pendingInspections,
  inProgressInspections,
  completedInspections,
  color,
  initials,
  syncStatus,
  serverVersion,
}: {
  id: string;
  name: string;
  properties: number;
  pendingInspections: number;
  inProgressInspections: number;
  completedInspections: number;
  color: string;
  initials: string;
  syncStatus: string;
  serverVersion: number;
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
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {name}
            </Text>

            <Text
              style={[
                styles.propertyCount,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {properties} inmueble{properties === 1 ? "" : "s"} registrado
              {properties === 1 ? "" : "s"}
            </Text>

            <View style={styles.companyStats}>
              <StatusStat
                value={pendingInspections}
                label="pendientes"
                color={colors.warning}
              />

              <StatusStat
                value={inProgressInspections}
                label="en proceso"
                color={colors.primary}
              />

              <StatusStat
                value={completedInspections}
                label="realizadas"
                color={colors.success}
              />
            </View>

            {/* Estado técnico temporal utilizado durante Field Test 0.1 */}
            <Text
              style={[
                styles.syncStatus,
                {
                  color:
                    syncStatus === "synced"
                      ? colors.success
                      : syncStatus === "error"
                        ? colors.warning
                        : colors.textSecondary,
                },
              ]}
            >
              Sync: {syncStatus} · servidor v{serverVersion}
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
  );
}

/*
 * ============================================================================
 * ESTADO DE INSPECCIÓN
 * ============================================================================
 */
function StatusStat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statusStat}>
      <View
        style={[
          styles.statusIndicator,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text
        style={[
          styles.stat,
          {
            color,
          },
        ]}
      >
        {value} {label}
      </Text>
    </View>
  );
}

/*
 * ============================================================================
 * MÉTRICA DE SINCRONIZACIÓN
 * ============================================================================
 */
function SyncStat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.syncStat}>
      <Text
        style={[
          styles.syncStatValue,
          {
            color,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.syncStatLabel,
          {
            color,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * ============================================================================
 * INICIALES
 * ============================================================================
 */
function createCompanyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "EM";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/*
 * ============================================================================
 * ESTILOS
 * ============================================================================
 */
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  header: {
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: FontSize.h1,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  subtitle: {
    maxWidth: 640,

    fontSize: FontSize.body,
    lineHeight: 24,
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: Spacing.sm,

    marginBottom: Spacing.lg,
  },

  actionButton: {
    minWidth: 180,
  },

  syncResultCard: {
    marginBottom: Spacing.lg,
  },

  syncResultTitle: {
    fontSize: FontSize.body,
    fontWeight: "700",

    marginBottom: Spacing.sm,
  },

  syncStats: {
    flexDirection: "row",
    flexWrap: "wrap",

    columnGap: Spacing.lg,
    rowGap: Spacing.sm,
  },

  syncStat: {
    minWidth: 90,
  },

  syncStatValue: {
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
  },

  syncStatLabel: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  companyCard: {
    width: "100%",

    overflow: "hidden",
  },

  accent: {
    height: 5,
  },

  companyContent: {
    minHeight: 126,

    flexDirection: "row",
    alignItems: "center",

    padding: Spacing.md,
  },

  companyLogo: {
    width: 52,
    height: 52,

    flexShrink: 0,

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

  propertyCount: {
    fontSize: FontSize.small,
    lineHeight: 20,

    marginBottom: Spacing.sm,
  },

  companyStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    columnGap: Spacing.sm,
    rowGap: Spacing.xs,
  },

  statusStat: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusIndicator: {
    width: 7,
    height: 7,

    borderRadius: Radius.full,

    marginRight: Spacing.xs,
  },

  stat: {
    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  syncStatus: {
    marginTop: Spacing.sm,

    fontSize: FontSize.caption,
    fontWeight: "600",
  },

  arrow: {
    flexShrink: 0,

    fontSize: 32,

    marginLeft: Spacing.sm,
  },
});
