import { Metadata } from 'next';
import CmsViewPage from '@/features/cms/components/cms-view-page';

export const metadata: Metadata = {
  title: 'Content Management',
  description: 'Manage your content across platforms.'
};

export default function Page() {
  return <CmsViewPage />;
}
