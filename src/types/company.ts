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

  propertyIds: string[];

  status: "active" | "inactive";
};
