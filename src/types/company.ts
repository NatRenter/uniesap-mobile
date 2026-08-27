export type CompanyBranding = {
  primaryColor: string;

  secondaryColor?: string;

  logo?: string;
};

export type Company = {
  id: string;

  name: string;

  legalName: string;

  rfc?: string;

  state: string;

  city: string;

  phone?: string;

  email?: string;

  branding: CompanyBranding;

  /*
   * La relación con los inmuebles NO se almacena aquí.
   *
   * La fuente real es:
   *
   * Property.companyId
   */
  status: "active" | "inactive";

  /*
   * Fecha de creación del registro.
   */
  createdAt: string;

  /*
   * Última modificación real de la empresa.
   */
  updatedAt: string;
};
