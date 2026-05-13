import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

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
  const { get } = useApi();

  const useGetOverview = (startDate?: string, endDate?: string) => {
    return useQuery({
      queryKey: ['analytics', 'overview', startDate, endDate],
      queryFn: () =>
        get<AnalyticsOverview>('/v1/analytics/overview', {
          startDate,
          endDate
        })
    });
  };

  return {
    useGetOverview
  };
};
