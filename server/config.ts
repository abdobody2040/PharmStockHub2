
export type OrgConfig = {
  name: string;
  dbUrl: string;
  apiPath: string;
}

export const getOrgConfig = (orgId: string): OrgConfig => {
  // Add your organization-specific configurations here
  const configs: Record<string, OrgConfig> = {
    org1: {
      name: 'Organization 1',
      dbUrl: process.env.ORG1_DB_URL || '',
      apiPath: '/api/org1'
    },
    org2: {
      name: 'Organization 2',
      dbUrl: process.env.ORG2_DB_URL || '',
      apiPath: '/api/org2'
    }
  };
  
  return configs[orgId] || configs.org1;
};
