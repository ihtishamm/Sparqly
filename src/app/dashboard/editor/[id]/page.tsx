import type { Metadata } from 'next';
import { EditorPage } from '@/features/editor/editor-page';

export const metadata: Metadata = { title: 'Editor' };

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditorPage id={id} />;
}
