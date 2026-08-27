export type Property = {
  id: string;

  companyId: string;

  name: string;

  type: string;

  state: string;

  city: string;

  address?: string;

  workers: number;

  formIds: string[];

  status: "active" | "inactive";

  /*
   * Fecha exacta de creación del inmueble.
   */
  createdAt: string;

  /*
   * Última modificación real del inmueble.
   */
  updatedAt: string;
};
