import type { Property } from "@/types/property";

/*
 * ============================================================================
 * SEED DE INMUEBLES
 * ============================================================================
 *
 * Se utiliza solamente cuando la persistencia todavía está vacía.
 *
 * Property.companyId será la relación principal con Company.
 */
export const initialProperties: Property[] = [
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

    createdAt: "2026-08-01T09:10:00.000Z",
    updatedAt: "2026-08-01T09:10:00.000Z",
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

    createdAt: "2026-08-01T09:15:00.000Z",
    updatedAt: "2026-08-01T09:15:00.000Z",
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

    createdAt: "2026-08-01T09:20:00.000Z",
    updatedAt: "2026-08-01T09:20:00.000Z",
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

    createdAt: "2026-08-01T09:25:00.000Z",
    updatedAt: "2026-08-01T09:25:00.000Z",
  },
];
