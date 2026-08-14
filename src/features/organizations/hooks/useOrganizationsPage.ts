import { useEffect, useState } from 'react';
import { useOrganization, Organization, Project } from '@/context/OrganizationProvider';
import { navigateTo } from '@/config/navigationConfig';

const PLAN_MAP: Record<string, string> = {
  'Free - $0/month': 'free',
  'Pro - $25/month': 'pro',
};

export function useOrganizationsPage() {
  const {
    organizations,
    projects,
    services,
    isLoading,
    activeOrganization,
    activeProject,
    selectOrganization,
    createOrganization,
    selectProject,
    createProject,
    getAvailableServices,
    loadServices,
  } = useOrganization();

  const [orgSearch, setOrgSearch] = useState('');
  const [projSearch, setProjSearch] = useState('');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Services are only needed by the create-project form — fetch on demand.
  useEffect(() => {
    if (showCreateProjectModal) loadServices();
  }, [showCreateProjectModal, loadServices]);


  // Create Organization form
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgType, setOrgType] = useState('personal');
  const [orgPlan, setOrgPlan] = useState('Free - $0/month');
  const [orgLegalName, setOrgLegalName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [orgCompanySize, setOrgCompanySize] = useState('');
  const [orgFoundedOn, setOrgFoundedOn] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgTaxId, setOrgTaxId] = useState('');
  const [orgRegistrationNo, setOrgRegistrationNo] = useState('');
  const [orgAddress1, setOrgAddress1] = useState('');
  const [orgCity, setOrgCity] = useState('');
  const [orgState, setOrgState] = useState('');
  const [orgPostalCode, setOrgPostalCode] = useState('');
  const [orgCountry, setOrgCountry] = useState('IN');
  const [orgCurrency, setOrgCurrency] = useState('INR');
  const [orgDescription, setOrgDescription] = useState('');
  const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);

  // Create Project form
  const [projName, setProjName] = useState('');
  const [projCode, setProjCode] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projServiceId, setProjServiceId] = useState('');
  const [projEnvironment, setProjEnvironment] = useState('production');
  const [isSubmittingProj, setIsSubmittingProj] = useState(false);

  const filteredOrgs = organizations.filter((org: Organization) =>
    org.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
    org.code.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const getProjectsForOrg = (orgId: string): Project[] =>
    projects.filter((p: Project) => p.orgId === orgId);

  const handleSelectOrg = (orgId: string) => {
    selectOrganization(orgId);
    navigateTo(`/dashboard/org/${orgId}`);
  };

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setIsSubmittingOrg(true);
    setFormError(null);
    try {
      const newOrg = await createOrganization({
        name: orgName.trim(),
        code: orgCode.trim() || undefined,
        orgType,
        plan: PLAN_MAP[orgPlan] || 'free',
        legalName: orgLegalName.trim() || undefined,
        industry: orgIndustry.trim() || undefined,
        companySize: orgCompanySize || undefined,
        foundedOn: orgFoundedOn || undefined,
        website: orgWebsite.trim() || undefined,
        email: orgEmail.trim() || undefined,
        phone: orgPhone.trim() || undefined,
        taxId: orgTaxId.trim() || undefined,
        registrationNo: orgRegistrationNo.trim() || undefined,
        addressLine1: orgAddress1.trim() || undefined,
        city: orgCity.trim() || undefined,
        state: orgState.trim() || undefined,
        postalCode: orgPostalCode.trim() || undefined,
        country: orgCountry.trim().toUpperCase() || undefined,
        currencyCode: orgCurrency.trim().toUpperCase() || undefined,
        description: orgDescription.trim() || undefined,
      });
      setOrgName('');
      setOrgCode('');
      navigateTo(`/dashboard/org/${newOrg.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create organization');
    } finally {
      setIsSubmittingOrg(false);
    }
  };

  const handleSelectProj = (projectId: string) => {
    selectProject(projectId);
    navigateTo(`/dashboard/project/${projectId}/overview`);
  };

  const handleCreateProjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !activeOrganization) return;
    if (!projServiceId) {
      setFormError('Please choose a solution for this project');
      return;
    }
    setIsSubmittingProj(true);
    setFormError(null);
    try {
      const newProj = await createProject({
        name: projName.trim(),
        orgId: activeOrganization.id,
        serviceId: projServiceId,
        code: projCode.trim() || undefined,
        description: projDescription.trim() || undefined,
        environment: projEnvironment,
      });
      setProjName('');
      setProjCode('');
      setProjDescription('');
      setProjServiceId('');
      setShowCreateProjectModal(false);
      navigateTo(`/dashboard/project/${newProj.id}/overview`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create project');
    } finally {
      setIsSubmittingProj(false);
    }
  };

  return {
    organizations,
    projects,
    services,
    isLoading,
    formError,
    activeOrganization,
    activeProject,
    filteredOrgs,
    orgSearch,
    setOrgSearch,
    projSearch,
    setProjSearch,
    showCreateProjectModal,
    setShowCreateProjectModal,
    availableServices: activeOrganization ? getAvailableServices(activeOrganization.id) : services,
    orgName,
    setOrgName,
    orgCode,
    setOrgCode,
    orgType,
    setOrgType,
    orgPlan,
    setOrgPlan,
    orgLegalName,
    setOrgLegalName,
    orgIndustry,
    setOrgIndustry,
    orgCompanySize,
    setOrgCompanySize,
    orgFoundedOn,
    setOrgFoundedOn,
    orgWebsite,
    setOrgWebsite,
    orgEmail,
    setOrgEmail,
    orgPhone,
    setOrgPhone,
    orgTaxId,
    setOrgTaxId,
    orgRegistrationNo,
    setOrgRegistrationNo,
    orgAddress1,
    setOrgAddress1,
    orgCity,
    setOrgCity,
    orgState,
    setOrgState,
    orgPostalCode,
    setOrgPostalCode,
    orgCountry,
    setOrgCountry,
    orgCurrency,
    setOrgCurrency,
    orgDescription,
    setOrgDescription,
    isSubmittingOrg,
    projName,
    setProjName,
    projCode,
    setProjCode,
    projDescription,
    setProjDescription,
    projServiceId,
    setProjServiceId,
    projEnvironment,
    setProjEnvironment,
    isSubmittingProj,
    getProjectsForOrg,
    handleSelectOrg,
    handleCreateOrgSubmit,
    handleSelectProj,
    handleCreateProjSubmit,
  };
}
