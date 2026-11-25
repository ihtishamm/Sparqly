import { cookies } from 'next/headers';
import { AppShell } from '@/components/shell/app-shell';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';
  return <AppShell defaultOpen={defaultOpen}>{children}</AppShell>;
}
