import React from 'react';
import { Header } from '@/components/common/Header';
import { useOrganizationsPage } from '../hooks/useOrganizationsPage';
import { Organization, Project } from '@/context/OrganizationProvider';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { PageContainer } from '@/components/common/PageContainer';
import { navigateTo } from '@/config/navigationConfig';

interface CreateOrganizationPageProps {
  userEmail?: string;
  onLogout?: () => void;
  activeOrganization?: Organization | null;
  activeProject?: Project | null;
}

const sectionStyle: React.CSSProperties = { borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' };
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const hintStyle: React.CSSProperties = { fontSize: '0.70rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' };

export const CreateOrganizationPage: React.FC<CreateOrganizationPageProps> = ({
  userEmail,
  onLogout,
  activeOrganization,
  activeProject,
}) => {
  const {
    orgName, setOrgName, orgCode, setOrgCode, orgType, setOrgType, orgPlan, setOrgPlan,
    orgLegalName, setOrgLegalName, orgIndustry, setOrgIndustry, orgCompanySize, setOrgCompanySize,
    orgFoundedOn, setOrgFoundedOn, orgWebsite, setOrgWebsite, orgEmail, setOrgEmail, orgPhone, setOrgPhone,
    orgTaxId, setOrgTaxId, orgRegistrationNo, setOrgRegistrationNo, orgAddress1, setOrgAddress1,
    orgCity, setOrgCity, orgState, setOrgState, orgPostalCode, setOrgPostalCode, orgCountry, setOrgCountry,
    orgCurrency, setOrgCurrency, orgDescription, setOrgDescription, formError, isSubmittingOrg, handleCreateOrgSubmit,
  } = useOrganizationsPage();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', flexDirection: 'column' }}>
      <Header userEmail={userEmail} onLogout={onLogout} showTenantSwitchers={false} activeOrganization={activeOrganization} activeProject={activeProject} onOpenTenantSelector={() => navigateTo('/dashboard/organizations')} />

      <main style={{ flex: 1, width: '100%', padding: '24px 16px 80px' }}>
        <PageContainer maxWidth="720px">
          <form onSubmit={handleCreateOrgSubmit} className="erp-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create a new organization</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.45 }}>
              Organizations group your projects. Keep the full company profile here — you can create as many organizations as you need.
            </p>
          </div>

          <div style={sectionStyle}>
            <div>
              <Input label="Name *" placeholder="Organization name" value={orgName} onChange={(e) => setOrgName(e.target.value)} maxLength={120} required autoFocus />
              <span style={hintStyle}>What's the name of your company or team? You can change this later.</span>
            </div>

            <div style={rowStyle}>
              <div>
                <Input label="Short code" placeholder="e.g., DIGO-HQ" value={orgCode} onChange={(e) => setOrgCode(e.target.value.toUpperCase())} maxLength={40} />
                <span style={hintStyle}>Letters, numbers, - and _ only. Auto-generated if empty.</span>
              </div>
              <Input label="Legal name" placeholder="Registered legal entity name" value={orgLegalName} onChange={(e) => setOrgLegalName(e.target.value)} maxLength={160} />
            </div>

            <div style={rowStyle}>
              <div className="erp-input-group">
                <label className="erp-label">Type</label>
                <select className="erp-input" value={orgType} onChange={(e) => setOrgType(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                  <option value="personal">Personal</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="educational">Educational</option>
                  <option value="non_profit">Non-profit</option>
                  <option value="government">Government</option>
                </select>
              </div>

              <div className="erp-input-group">
                <label className="erp-label">Plan</label>
                <select className="erp-input" value={orgPlan} onChange={(e) => setOrgPlan(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                  <option value="Free - $0/month">Free - $0/month</option>
                  <option value="Pro - $25/month">Pro - $25/month</option>
                </select>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Company profile</h3>
            <div style={rowStyle}>
              <Input label="Industry" placeholder="e.g., Technology & ERP" value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} maxLength={100} />
              <div className="erp-input-group">
                <label className="erp-label">Company size</label>
                <select className="erp-input" value={orgCompanySize} onChange={(e) => setOrgCompanySize(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                  <option value="">Not specified</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>

            <div style={rowStyle}>
              <div className="erp-input-group">
                <label className="erp-label">Founded on</label>
                <input type="date" className="erp-input" value={orgFoundedOn} max={new Date().toISOString().split('T')[0]} onChange={(e) => setOrgFoundedOn(e.target.value)} />
              </div>
              <Input label="Website" placeholder="https://example.com" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} maxLength={200} />
            </div>

            <div style={rowStyle}>
              <Input label="Contact email" type="email" placeholder="contact@example.com" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} maxLength={255} />
              <Input label="Phone" placeholder="+91 98765 43210" value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} maxLength={20} />
            </div>

            <div style={rowStyle}>
              <Input label="Tax ID / GSTIN" placeholder="Tax identification number" value={orgTaxId} onChange={(e) => setOrgTaxId(e.target.value)} maxLength={40} />
              <Input label="Registration number" placeholder="Company registration number" value={orgRegistrationNo} onChange={(e) => setOrgRegistrationNo(e.target.value)} maxLength={60} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Address & locale</h3>
            <Input label="Address" placeholder="Street address" value={orgAddress1} onChange={(e) => setOrgAddress1(e.target.value)} maxLength={200} />

            <div style={rowStyle}>
              <Input label="City" value={orgCity} onChange={(e) => setOrgCity(e.target.value)} maxLength={100} />
              <Input label="State" value={orgState} onChange={(e) => setOrgState(e.target.value)} maxLength={100} />
            </div>

            <div style={rowStyle}>
              <Input label="Postal code" value={orgPostalCode} onChange={(e) => setOrgPostalCode(e.target.value)} maxLength={12} />
              <div>
                <Input label="Country code" placeholder="IN" value={orgCountry} onChange={(e) => setOrgCountry(e.target.value.toUpperCase())} maxLength={2} />
                <span style={hintStyle}>Two-letter ISO code, e.g. IN, US.</span>
              </div>
            </div>

            <div style={rowStyle}>
              <div>
                <Input label="Currency" placeholder="INR" value={orgCurrency} onChange={(e) => setOrgCurrency(e.target.value.toUpperCase())} maxLength={3} />
                <span style={hintStyle}>Three-letter ISO code, e.g. INR, USD.</span>
              </div>
            </div>

            <div className="erp-input-group">
              <label className="erp-label">Description</label>
              <textarea className="erp-input" rows={3} maxLength={1000} placeholder="What does this organization do?" value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>

          {formError && <p style={{ fontSize: '0.78rem', color: 'var(--red-danger, #c0392b)', margin: 0 }}>{formError}</p>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={() => navigateTo('/dashboard/organizations')} style={{ fontSize: '12px', padding: '8px 14px' }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingOrg} disabled={!orgName.trim()} style={{ background: 'var(--green-success)', borderColor: 'var(--green-success)', fontSize: '12px', padding: '8px 16px' }}>Create organization</Button>
          </div>
        </form>
        </PageContainer>
      </main>
    </div>
  );
};
