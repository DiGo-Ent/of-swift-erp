import React, { useMemo } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { MetricsOverview } from '../components/MetricsOverview';
import { RecentActivityTable } from '../components/RecentActivityTable';
import { dashboardService } from '../services/dashboardService';

export const OverviewPage: React.FC = () => {
  const metrics = useMemo(() => dashboardService.getMetrics(), []);
  const transactions = useMemo(() => dashboardService.getRecentTransactions(), []);

  return (
    <PageContainer maxWidth="1200px">
      <MetricsOverview metrics={metrics} />
      <RecentActivityTable transactions={transactions} />
    </PageContainer>
  );
};

export default OverviewPage;
