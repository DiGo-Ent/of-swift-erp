import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FolderPlus } from 'lucide-react';
import type { Service } from '@/types/organization.types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName?: string;
  projName: string;
  setProjName: (val: string) => void;
  projCode: string;
  setProjCode: (val: string) => void;
  projDescription: string;
  setProjDescription: (val: string) => void;
  services: Service[];
  projServiceId: string;
  setProjServiceId: (val: string) => void;
  projEnvironment: string;
  setProjEnvironment: (val: string) => void;
  errorMessage?: string | null;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  orgName,
  projName,
  setProjName,
  projCode,
  setProjCode,
  projDescription,
  setProjDescription,
  services,
  projServiceId,
  setProjServiceId,
  projEnvironment,
  setProjEnvironment,
  errorMessage,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create New Project (${orgName || 'Organization'})`}
      icon={<FolderPlus size={18} color="var(--green-success)" />}
      maxWidth="440px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="erp-input-group">
          <label className="erp-label">Solution *</label>
          <select
            className="erp-input"
            value={projServiceId}
            onChange={(e) => setProjServiceId(e.target.value)}
            required
            style={{ background: 'var(--bg-surface)' }}
          >
            <option value="">Select a solution</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            {services.length === 0
              ? 'All available solutions already have a project in this organization.'
              : 'One organization can hold only one project per solution.'}
          </span>
        </div>

        <Input
          label="Project Name *"
          placeholder="e.g., DiGo ERP Production"
          value={projName}
          onChange={(e) => setProjName(e.target.value)}
          maxLength={120}
          required
          autoFocus
        />

        <Input
          label="Project Short Code"
          placeholder="e.g., PROJ-PROD"
          value={projCode}
          onChange={(e) => setProjCode(e.target.value.toUpperCase())}
          maxLength={40}
        />

        <div className="erp-input-group">
          <label className="erp-label">Environment</label>
          <select
            className="erp-input"
            value={projEnvironment}
            onChange={(e) => setProjEnvironment(e.target.value)}
            style={{ background: 'var(--bg-surface)' }}
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="sandbox">Sandbox</option>
          </select>
        </div>

        <div className="erp-input-group">
          <label className="erp-label">Project Description</label>
          <textarea
            className="erp-input"
            rows={3}
            maxLength={1000}
            placeholder="Describe the environment or purpose of this project"
            value={projDescription}
            onChange={(e) => setProjDescription(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {errorMessage && (
          <p style={{ fontSize: '0.75rem', color: 'var(--red-danger, #c0392b)', margin: 0 }}>{errorMessage}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={services.length === 0}
            style={{ background: 'var(--green-success)', borderColor: 'var(--green-success)' }}
          >
            <FolderPlus size={14} />
            <span>Create Project</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
