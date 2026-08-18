import type { Company } from "@/types/company";

export const companies: Company[] = [
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

    propertyIds: ["property-001", "property-002", "property-003"],

    status: "active",
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

    propertyIds: ["property-004"],

    status: "active",
  },
];

const legacyCompanyIds: Record<string, string> = {
  "1": "company-001",
  "2": "company-002",
};

export function getCompanyById(id: string) {
  const resolvedId = legacyCompanyIds[id] ?? id;

  return companies.find((company) => company.id === resolvedId);
}
