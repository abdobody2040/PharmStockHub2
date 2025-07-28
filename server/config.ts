import * as dotenv from 'dotenv';
dotenv.config();



export type OrgConfig = {
  name: string;
  dbUrl: string;
  apiPath: string;
  theme: {
    primaryColor: string;
    logo: string;
  };
}

export interface CompanyData {
  id: string;
  config: OrgConfig;
}

// Store companies in memory (in production this would be in a database)
const companiesMap = new Map<string, OrgConfig>();

export const registerCompany = (id: string, config: OrgConfig) => {
  companiesMap.set(id, config);
};

export const getOrgConfig = (orgId: string): OrgConfig => {
  // If company exists, return its config
  if (companiesMap.has(orgId)) {
    return companiesMap.get(orgId)!;
  }

  // Return default config if company not found
  return {
    name: 'Default Company',
    dbUrl: process.env.DEFAULT_DB_URL || '',
    apiPath: '/api/default',
    theme: {
      primaryColor: '#2563eb',
      logo: '/default-logo.png'
    }
  };
};

// Initialize with some example companies
registerCompany('company1', {
  name: 'Company One',
  dbUrl: process.env.COMPANY1_DB_URL || '',
  apiPath: '/api/company1',
  theme: {
    primaryColor: '#2563eb',
    logo: '/company1-logo.png'
  }
});

// Function to get all registered companies
export const getAllCompanies = (): CompanyData[] => {
  return Array.from(companiesMap.entries()).map(([id, config]) => ({
    id,
    config
  }));
};

// Function to add a new company
export const addCompany = (
  id: string,
  name: string,
  dbUrl: string,
  primaryColor: string = '#2563eb',
  logo: string = '/default-logo.png'
) => {
  registerCompany(id, {
    name,
    dbUrl,
    apiPath: `/api/${id}`,
    theme: {
      primaryColor,
      logo
    }
  });
};
