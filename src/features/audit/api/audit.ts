import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
}

export const useAudit = () => {
  const useGetActivityLogs = (page = 1, limit = 10) => {
    return useQuery({
      queryKey: ['audit', 'activity', page, limit],
      queryFn: async () => {
        return apiClient.get<any>('/v1/audit-activity/activity', {
          params: { page, limit }
        });
      }
    });
  };

  return {
    useGetActivityLogs
  };
};
