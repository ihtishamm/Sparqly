import { Metadata } from 'next';
import ConnectionsViewPage from '@/features/connections/components/connections-view-page';

export const metadata: Metadata = {
  title: 'Connections',
  description: 'Connect your social media accounts.'
};

export default function Page() {
  return <ConnectionsViewPage />;
}
