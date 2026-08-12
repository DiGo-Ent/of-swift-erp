export interface ErpMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  type: 'currency' | 'number' | 'percentage';
}

export interface ErpModule {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badgeText: string;
  actionLabel: string;
}

export interface RecentTransaction {
  id: string;
  invoiceNo: string;
  customerName: string;
  amount: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}
