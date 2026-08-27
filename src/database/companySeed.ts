import type { Company } from "@/types/company";

/*
 * ============================================================================
 * SEED DE EMPRESAS
 * ============================================================================
 *
 * Datos iniciales utilizados únicamente cuando la persistencia
 * todavía no contiene empresas.
 *
 * Los inmuebles ya NO se relacionan mediante propertyIds.
 *
 * La relación real es:
 *
 * Property.companyId
 */
export const initialCompanies: Company[] = [
  {
    id: "company-001",

    name: "AutoZone",

    legalName: "AutoZone de México S. de R.L. de C.V.",

    state: "Guanajuato",

    city: "San Luis de la Paz",

    branding: {
      primaryColor: "#F97316",

      secondaryColor: "#FFE7D0",
    },

    status: "active",

    createdAt: "2026-08-01T09:00:00.000Z",

    updatedAt: "2026-08-01T09:00:00.000Z",
  },

  {
    id: "company-002",

    name: "LALA",

    legalName: "Empresa LALA",

    state: "Michoacán",

    city: "La Piedad",

    branding: {
      primaryColor: "#EF4444",

      secondaryColor: "#FEE2E2",
    },

    status: "active",

    createdAt: "2026-08-01T09:05:00.000Z",

    updatedAt: "2026-08-01T09:05:00.000Z",
  },
];
