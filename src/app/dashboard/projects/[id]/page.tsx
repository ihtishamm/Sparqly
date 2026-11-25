import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProjectDetailPage } from '@/features/projects/project-detail';

export const metadata: Metadata = { title: 'Project' };

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <ProjectDetailPage id={id} />
    </Suspense>
  );
}
