import { Metadata } from 'next';
import CreateViewPage from '@/features/create/components/create-view-page';

export const metadata: Metadata = {
  title: 'Create Content',
  description: 'Create new content with AI.'
};

export default function Page() {
  return <CreateViewPage />;
}
