export interface Service {
  id: string;
  key: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  legalName?: string;
  orgType?: string;
  industry?: string;
  companySize?: string;
  foundedOn?: string;
  website?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  registrationNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  currencyCode?: string;
  logoUrl?: string;
  description?: string;
  plan?: string;
  status?: string;
  createdAt: string;
}

export interface OrganizationInput {
  name: string;
  code?: string;
  legalName?: string;
  orgType?: string;
  industry?: string;
  companySize?: string;
  foundedOn?: string;
  website?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  registrationNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  currencyCode?: string;
  description?: string;
  plan?: string;
}

export interface Project {
  id: string;
  orgId: string;
  serviceId: string;
  name: string;
  code: string;
  description?: string;
  environment?: string;
  status?: string;
  createdAt: string;
}

export interface ProjectInput {
  name: string;
  orgId: string;
  serviceId: string;
  code?: string;
  description?: string;
  environment?: string;
}
