import React from 'react';
import { RecentTransaction } from '@/types/dashboard.types';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface RecentActivityTableProps {
  transactions: RecentTransaction[];
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  transactions,
}) => {
  return (
    <div className="erp-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Recent Invoices
        </h3>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ fontWeight: 700, color: 'var(--blue-primary)' }}>
                  {tx.invoiceNo}
                </td>
                <td>{tx.customerName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{tx.date}</td>
                <td style={{ fontWeight: 700 }}>{tx.amount}</td>
                <td>
                  {tx.status === 'Paid' && (
                    <span className="erp-badge erp-badge-green">Paid</span>
                  )}
                  {tx.status === 'Pending' && (
                    <span className="erp-badge erp-badge-amber">Pending</span>
                  )}
                  {tx.status === 'Overdue' && (
                    <span className="erp-badge erp-badge-red">Overdue</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
