import { Metadata } from 'next';
import ConfirmEmailViewPage from '@/features/auth/components/confirm-email-view';

export const metadata: Metadata = {
  title: 'Authentication | Confirm Email',
  description: 'Confirm Email page for authentication.'
};

export default function Page() {
  return <ConfirmEmailViewPage />;
}
