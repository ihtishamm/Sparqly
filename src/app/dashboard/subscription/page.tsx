import { Metadata } from 'next';
import SubscriptionViewPage from '@/features/subscription/components/subscription-view-page';

export const metadata: Metadata = {
  title: 'Subscription',
  description: 'Manage your subscription and usage.'
};

export default function Page() {
  return <SubscriptionViewPage />;
}
