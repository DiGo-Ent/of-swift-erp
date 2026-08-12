import React from 'react';
import { ErpMetric } from '@/types/dashboard.types';
import { TrendingUp, TrendingDown, AlertCircle, ArrowUpRight } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: ErpMetric[];
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  return (
    <div className="erp-grid-4" style={{ marginBottom: '20px' }}>
      {metrics.map((item) => (
        <div key={item.id} className="erp-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {item.title}
          </span>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue-primary)' }}>
              {item.value}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
            {item.isPositive ? (
              <span style={{ color: 'var(--green-success)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={12} /> {item.change}
              </span>
            ) : item.change.includes('Action') ? (
              <span style={{ color: 'var(--red-danger)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <AlertCircle size={12} /> {item.change}
              </span>
            ) : (
              <span style={{ color: 'var(--amber-warning)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <TrendingDown size={12} /> {item.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
