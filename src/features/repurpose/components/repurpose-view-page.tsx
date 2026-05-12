'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { RepurposeFlow } from './repurpose-flow';
export default function RepurposeViewPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-8 pb-12'>
        <header className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1.5'>
            <div className='flex items-center gap-2'>
              <Badge
                variant='secondary'
                className='bg-primary/10 text-primary rounded-md border-none font-semibold'
              >
                AI Powered
              </Badge>
              <span className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                Content Engine
              </span>
            </div>
            <h1 className='text-3xl font-bold tracking-tight md:text-5xl'>
              Repurpose <span className='text-primary'>Magic</span>
            </h1>
            <p className='text-muted-foreground max-w-2xl text-lg'>
              Turn any video or audio into a month&apos;s worth of social media
              content in seconds. Powered by advanced AI understanding.
            </p>
          </div>
        </header>

        <div className='bg-border/50 h-px w-full' />

        <div>
          <RepurposeFlow />
        </div>
      </div>
    </PageContainer>
  );
}
