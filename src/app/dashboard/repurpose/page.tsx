import type { Metadata } from 'next';
import { RepurposePage } from '@/features/create/repurpose-page';

export const metadata: Metadata = { title: 'Repurpose' };

export default function Page() {
  return <RepurposePage />;
}
