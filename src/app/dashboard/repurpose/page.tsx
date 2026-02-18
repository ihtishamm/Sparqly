import { Metadata } from 'next';
import RepurposeViewPage from '@/features/repurpose/components/repurpose-view-page';

export const metadata: Metadata = {
  title: 'Repurpose Content',
  description: 'Repurpose your content into clips, blog posts, and captions.'
};

export default function Page() {
  return <RepurposeViewPage />;
}
