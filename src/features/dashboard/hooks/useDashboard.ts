import { useState } from 'react';
import { dashboardService } from '@/features/dashboard/services/dashboardService';

export function useDashboard() {
  const [metrics] = useState(dashboardService.getMetrics());
  const [transactions, setTransactions] = useState(dashboardService.getRecentTransactions());
  const [activeModule, setActiveModule] = useState<string>('all');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState<boolean>(false);

  const addNewTransaction = (tx: { customerName: string; amount: string }) => {
    const newTx = {
      id: 'tx_' + Date.now(),
      invoiceNo: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: tx.customerName,
      amount: `₹${Number(tx.amount).toLocaleString('en-IN')}`,
      date: 'Just now',
      status: 'Paid' as const,
    };
    setTransactions([newTx, ...transactions]);
    setShowNewInvoiceModal(false);
  };

  return {
    metrics,
    transactions,
    activeModule,
    setActiveModule,
    showNewInvoiceModal,
    setShowNewInvoiceModal,
    addNewTransaction,
  };
}
