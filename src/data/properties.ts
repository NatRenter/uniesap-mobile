import type { Property } from "@/types/property";

export const properties: Property[] = [
  {
    id: "property-001",
    companyId: "company-001",

    name: "Sucursal San Luis de la Paz",
    type: "Sucursal comercial",

    state: "Guanajuato",
    city: "San Luis de la Paz",

    workers: 18,

    formIds: ["form-001", "form-002", "form-003"],

    status: "active",
  },

  {
    id: "property-002",
    companyId: "company-001",

    name: "Sucursal Centro",
    type: "Sucursal comercial",

    state: "Guanajuato",
    city: "Dolores Hidalgo",

    workers: 12,

    formIds: ["form-001", "form-002"],

    status: "active",
  },

  {
    id: "property-003",
    companyId: "company-001",

    name: "Centro de distribución",
    type: "Centro de distribución",

    state: "Guanajuato",
    city: "San José Iturbide",

    workers: 42,

    formIds: ["form-001", "form-003"],

    status: "active",
  },

  {
    id: "property-004",
    companyId: "company-002",

    name: "LALA La Piedad",
    type: "Centro de trabajo",

    state: "Michoacán",
    city: "La Piedad",

    workers: 85,

    formIds: ["form-001"],

    status: "active",
  },
];

export function getPropertiesByCompanyId(companyId: string) {
  return properties.filter((property) => property.companyId === companyId);
}

export function getPropertyById(id: string) {
  const resolvedId = resolvePropertyId(id);

  return properties.find((property) => property.id === resolvedId);
}

const legacyPropertyIds: Record<string, string> = {
  "1": "property-001",
  "2": "property-002",
  "3": "property-003",
  "4": "property-004",
};

export function resolvePropertyId(id: string) {
  return legacyPropertyIds[id] ?? id;
}
