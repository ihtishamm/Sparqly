'use client';

import PageContainer from '@/components/layout/page-container';
import { CreativeStudio } from './creative-studio';
import { Badge } from '@/components/ui/badge';

export default function CreateViewPage() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex h-full flex-1 flex-col gap-6 pb-4'>
        <header className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <Badge
                variant='secondary'
                className='rounded-md border-none bg-purple-500/10 font-semibold text-purple-600'
              >
                Creative Studio
              </Badge>
              <span className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                Magic Canvas
              </span>
            </div>
            <h1 className='text-3xl font-bold tracking-tight md:text-5xl'>
              Creative <span className='text-primary'>Studio</span>
            </h1>
            <p className='text-muted-foreground max-w-2xl text-lg'>
              Generate high-quality videos, images, and articles from scratch
              using advanced AI.
            </p>
          </div>
        </header>

        <CreativeStudio />
      </div>
    </PageContainer>
  );
}
