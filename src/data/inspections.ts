/*
 * ============================================================================
 * COMPATIBILIDAD DE INSPECCIONES
 * ============================================================================
 *
 * Históricamente las pantallas de UNIESAP importaban
 * las inspecciones desde:
 *
 * @/data/inspections
 *
 * Ahora la fuente real se encuentra en:
 *
 * @/repositories/inspectionRepository
 *
 * Mantenemos este archivo temporalmente como fachada
 * para no tener que modificar todas las pantallas
 * de una sola vez.
 */

export {
  createInspection, deleteInspection, getInspectionById, getInspections, getInspectionsByCompanyId,
  getInspectionsByPropertyId, inspections, updateInspection, updateInspectionSyncStatus
} from "@/repositories/inspectionRepository";

export type { CreateInspectionInput } from "@/repositories/inspectionRepository";

