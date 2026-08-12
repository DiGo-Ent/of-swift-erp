import { ErpMetric, ErpModule, RecentTransaction } from '@/types/dashboard.types';

export const dashboardService = {
  getMetrics(): ErpMetric[] {
    return [
      { id: '1', title: "Today's Gross Sales", value: '₹1,48,920', change: '+18.4%', isPositive: true, type: 'currency' },
      { id: '2', title: 'Pending Orders', value: '42 Orders', change: '-5.2%', isPositive: true, type: 'number' },
      { id: '3', title: 'Low Stock Alerts', value: '8 Items', change: 'Action Required', isPositive: false, type: 'number' },
      { id: '4', title: 'Active Attendance', value: '94.2%', change: '+2.1%', isPositive: true, type: 'percentage' },
    ];
  },

  getRecentTransactions(): RecentTransaction[] {
    return [
      { id: 'tx_101', invoiceNo: 'INV-2026-089', customerName: 'Apex Retails Pvt Ltd', amount: '₹34,500', date: 'Today, 02:15 PM', status: 'Paid' },
      { id: 'tx_102', invoiceNo: 'INV-2026-088', customerName: 'Sharma Logistics', amount: '₹18,200', date: 'Today, 11:40 AM', status: 'Pending' },
      { id: 'tx_103', invoiceNo: 'INV-2026-087', customerName: 'TechnoCraft Solutions', amount: '₹62,000', date: 'Yesterday', status: 'Paid' },
      { id: 'tx_104', invoiceNo: 'INV-2026-086', customerName: 'Global Enterprises', amount: '₹9,800', date: 'Aug 07, 2026', status: 'Overdue' },
    ];
  }
};
