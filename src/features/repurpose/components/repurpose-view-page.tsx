'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { RepurposeFlow } from './repurpose-flow';
import { useOnboardingStore } from '@/store/onboarding-store';
import React from 'react';

export default function RepurposeViewPage() {
  const { startTour, completedTours } = useOnboardingStore();

  React.useEffect(() => {
    if (!completedTours.includes('repurpose-overview')) {
      startTour(
        [
          {
            target: '[data-tour="repurpose-header"]',
            title: 'Welcome to Sparqly! 🚀',
            content:
              'The most powerful AI platform to repurpose your video and audio content into social media magic.',
            placement: 'bottom'
          },
          {
            target: '[data-tour="repurpose-flow"]',
            title: 'Your Content Engine',
            content:
              'Simply paste a link or upload a file here. Our AI will analyze it and generate dozens of shorts, clips, and blog posts.',
            placement: 'top'
          },
          {
            target: '[data-tour="credits"]',
            title: 'AI Credits',
            content:
              'AI generations consume credits. You can track your balance and upgrade your plan here.',
            placement: 'right'
          },
          {
            target: '[data-tour="user-profile"]',
            title: 'Account & Billing',
            content: 'Manage your profile, billing, and settings here.',
            placement: 'right'
          }
        ],
        'repurpose-overview'
      );
    }
  }, [completedTours, startTour]);

  return (
    <PageContainer scrollable={true}>
      <div
        className='flex flex-1 flex-col gap-8 pb-12'
        data-tour='repurpose-header'
      >
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

        <div data-tour='repurpose-flow'>
          <RepurposeFlow />
        </div>
      </div>
    </PageContainer>
  );
}
