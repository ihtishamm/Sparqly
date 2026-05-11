import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AnalyticsOverview {
  kpis: {
    totalPosts: number;
    views: number;
    engagementRate: number;
    growth: number;
  };
  timeSeries: Array<{
    date: string;
    views: number;
    engagement: number;
  }>;
  platformBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export const useAnalytics = () => {
  const useGetOverview = (startDate?: string, endDate?: string) => {
    return useQuery({
      queryKey: ['analytics', 'overview', startDate, endDate],
      queryFn: async () => {
        const response = await apiClient.get<AnalyticsOverview>(
          '/v1/analytics/overview',
          {
            params: { startDate, endDate }
          }
        );
        return response;
      }
    });
  };

  return {
    useGetOverview
  };
};
