'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '../api/subscription';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconCheck,
  IconBolt,
  IconCrown,
  IconBuildingSkyscraper
} from '@tabler/icons-react';

const PLAN_ICONS: Record<string, any> = {
  Starter: IconBolt,
  Pro: IconCrown,
  Enterprise: IconBuildingSkyscraper
};

export default function SubscriptionViewPage() {
  const { useGetWallet, useGetPlans, createCheckoutSessionMutation } =
    useSubscription();
  const { data: wallet, isLoading: isWalletLoading } = useGetWallet();
  const { data: plans, isLoading: isPlansLoading } = useGetPlans();

  const handleSelectPlan = (priceId: string) => {
    createCheckoutSessionMutation.mutate({ priceId, mode: 'subscription' });
  };

  const usagePercent = wallet
    ? (wallet.usageCount /
        (wallet.planCredits +
          wallet.rolledOverCredits +
          wallet.extraCredits +
          wallet.proratedCredits)) *
      100
    : 0;

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-10 pb-12'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight md:text-5xl'>
            Billing <span className='text-primary'>& Credits</span>
          </h1>
          <p className='text-muted-foreground max-w-2xl text-lg'>
            Manage your subscription, track usage, and top up your credits to
            keep creating.
          </p>
        </header>

        <div className='grid gap-6 md:grid-cols-[1fr_350px]'>
          <Card className='bg-muted/20 overflow-hidden rounded-3xl border-none shadow-sm'>
            <CardHeader className='bg-background/50 flex flex-row items-center justify-between border-b p-8'>
              <div>
                <CardTitle className='text-2xl'>Current Subscription</CardTitle>
                <div className='mt-2 flex items-center gap-2'>
                  <Badge className='bg-primary text-primary-foreground rounded-full px-4 py-1 font-bold'>
                    {isWalletLoading ? (
                      <Skeleton className='h-4 w-16' />
                    ) : wallet?.status === 'active' ? (
                      'Pro Plan'
                    ) : (
                      'Free Trial'
                    )}
                  </Badge>
                  <span className='text-muted-foreground text-sm font-medium'>
                    Renews on{' '}
                    {wallet?.currentPeriodEnd
                      ? format(
                          new Date(wallet.currentPeriodEnd),
                          'MMMM dd, yyyy'
                        )
                      : '...'}
                  </span>
                </div>
              </div>
              <Button
                variant='outline'
                className='h-12 rounded-xl px-6 font-bold'
              >
                Manage in Stripe
              </Button>
            </CardHeader>
            <CardContent className='space-y-8 p-8'>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div className='bg-background space-y-1 rounded-2xl border p-4 shadow-sm'>
                  <p className='text-muted-foreground text-[10px] font-bold tracking-widest uppercase'>
                    Balance
                  </p>
                  <p className='text-2xl font-bold'>{wallet?.balance || 0}</p>
                </div>
                <div className='bg-background space-y-1 rounded-2xl border p-4 shadow-sm'>
                  <p className='text-muted-foreground text-[10px] font-bold tracking-widest uppercase'>
                    Allocated
                  </p>
                  <p className='text-2xl font-bold'>
                    {wallet?.planCredits || 0}
                  </p>
                </div>
                <div className='bg-background space-y-1 rounded-2xl border p-4 shadow-sm'>
                  <p className='text-muted-foreground text-[10px] font-bold tracking-widest uppercase'>
                    Rollover
                  </p>
                  <p className='text-2xl font-bold'>
                    {wallet?.rolledOverCredits || 0}
                  </p>
                </div>
                <div className='bg-background space-y-1 rounded-2xl border p-4 shadow-sm'>
                  <p className='text-muted-foreground text-[10px] font-bold tracking-widest uppercase'>
                    Prorated
                  </p>
                  <p className='text-2xl font-bold'>
                    {wallet?.proratedCredits || 0}
                  </p>
                </div>
              </div>

              <div className='bg-background space-y-4 rounded-3xl border p-6 shadow-sm'>
                <div className='flex justify-between text-sm font-bold'>
                  <span>Usage this period</span>
                  <span className='text-primary'>
                    {wallet?.usageCount || 0} /{' '}
                    {(wallet?.planCredits || 0) +
                      (wallet?.rolledOverCredits || 0) +
                      (wallet?.proratedCredits || 0)}{' '}
                    used
                  </span>
                </div>
                <Progress value={usagePercent} className='h-3' />
                <p className='text-muted-foreground text-xs'>
                  You have{' '}
                  <span className='text-foreground font-bold'>
                    {wallet?.balance || 0}
                  </span>{' '}
                  credits remaining for AI video and blog generation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-primary text-primary-foreground shadow-primary/20 flex flex-col justify-between rounded-3xl border-none p-8 shadow-xl'>
            <div className='space-y-4'>
              <div className='w-fit rounded-2xl bg-white/20 p-3'>
                <IconBolt className='h-6 w-6' />
              </div>
              <h3 className='text-2xl font-bold'>Need more credits?</h3>
              <p className='text-primary-foreground/80 leading-relaxed'>
                Top up your extra credits instantly to avoid any interruptions
                in your creative workflow.
              </p>
            </div>
            <Button
              variant='secondary'
              className='mt-8 h-14 w-full rounded-2xl text-lg font-bold'
            >
              Buy Extra Credits
            </Button>
          </Card>
        </div>

        <section className='mt-4 space-y-8'>
          <div className='space-y-2 text-center'>
            <h2 className='text-3xl font-bold'>Upgrade your Plan</h2>
            <p className='text-muted-foreground'>
              Choose the perfect plan for your content creation needs.
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-3'>
            {isPlansLoading
              ? [1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-[450px] rounded-3xl' />
                ))
              : plans?.map((plan) => {
                  const Icon = PLAN_ICONS[plan.name] || IconBolt;
                  const isRecommended = plan.name === 'Pro';

                  return (
                    <Card
                      key={plan.priceId}
                      className={cn(
                        'flex flex-col rounded-[32px] border-none p-8 transition-all hover:scale-[1.02]',
                        isRecommended
                          ? 'bg-background ring-primary shadow-primary/10 shadow-2xl ring-2'
                          : 'bg-muted/30'
                      )}
                    >
                      <div className='mb-8 flex flex-row items-center justify-between'>
                        <div
                          className={cn(
                            'rounded-2xl p-3',
                            isRecommended
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background'
                          )}
                        >
                          <Icon className='h-6 w-6' />
                        </div>
                        {isRecommended && (
                          <Badge
                            variant='secondary'
                            className='rounded-full px-4'
                          >
                            Recommended
                          </Badge>
                        )}
                      </div>

                      <div className='mb-8 space-y-1'>
                        <h3 className='text-2xl font-bold'>{plan.name}</h3>
                        <div className='flex items-baseline gap-1'>
                          <span className='text-4xl font-bold'>
                            ${plan.price}
                          </span>
                          <span className='text-muted-foreground font-medium'>
                            /month
                          </span>
                        </div>
                      </div>

                      <ul className='mb-10 flex-1 space-y-4'>
                        <li className='flex items-center gap-3 text-sm font-medium'>
                          <div className='rounded-full bg-green-500/10 p-1'>
                            <IconCheck className='h-3 w-3 text-green-500' />
                          </div>
                          {plan.credits} AI Generation Credits
                        </li>
                        <li className='flex items-center gap-3 text-sm font-medium'>
                          <div className='rounded-full bg-green-500/10 p-1'>
                            <IconCheck className='h-3 w-3 text-green-500' />
                          </div>
                          50% Rollover Credits
                        </li>
                        <li className='flex items-center gap-3 text-sm font-medium'>
                          <div className='rounded-full bg-green-500/10 p-1'>
                            <IconCheck className='h-3 w-3 text-green-500' />
                          </div>
                          Full Video Editor Access
                        </li>
                      </ul>

                      <Button
                        onClick={() => handleSelectPlan(plan.priceId)}
                        className={cn(
                          'h-14 w-full rounded-2xl text-lg font-bold',
                          isRecommended
                            ? 'shadow-primary/20 shadow-lg'
                            : 'bg-background hover:bg-muted'
                        )}
                        variant={isRecommended ? 'default' : 'outline'}
                        disabled={createCheckoutSessionMutation.isPending}
                      >
                        {createCheckoutSessionMutation.isPending
                          ? 'Processing...'
                          : `Get ${plan.name}`}
                      </Button>
                    </Card>
                  );
                })}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
