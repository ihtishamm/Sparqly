import { Metadata } from 'next';
import AnalyticsViewPage from '@/features/analytics/components/analytics-view-page';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'View your content performance and insights.'
};

export default function Page() {
  return <AnalyticsViewPage />;
}
