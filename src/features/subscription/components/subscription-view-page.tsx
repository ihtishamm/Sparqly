'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  MOCK_PLANS,
  MOCK_CURRENT_PLAN,
  COMPARISON_FEATURES
} from '../constants/mock-plans';
import { cn } from '@/lib/utils';

export default function SubscriptionViewPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-8'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Subscription
          </h1>
          <p className='text-muted-foreground'>Manage your plan and usage.</p>
        </header>

        <Card className='rounded-2xl'>
          <CardHeader className='flex flex-row items-start justify-between gap-4'>
            <div>
              <CardTitle>Current plan</CardTitle>
              <p className='text-muted-foreground mt-1 text-sm'>
                Renews on {MOCK_CURRENT_PLAN.renewalDate}
              </p>
            </div>
            <Button className='rounded-xl'>Upgrade</Button>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {MOCK_CURRENT_PLAN.usageLabel}
                </span>
                <span>{MOCK_CURRENT_PLAN.usagePercent}%</span>
              </div>
              <Progress
                value={MOCK_CURRENT_PLAN.usagePercent}
                className='h-2'
              />
            </div>
          </CardContent>
        </Card>

        <section className='space-y-4'>
          <h2 className='text-lg font-semibold'>Choose a plan</h2>
          <div className='grid gap-6 md:grid-cols-3'>
            {MOCK_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'flex flex-col rounded-2xl transition-transform hover:scale-[1.02]',
                  plan.recommended && 'border-primary ring-primary/20 ring-2'
                )}
              >
                <CardHeader className='flex flex-row items-start justify-between gap-2'>
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.recommended && (
                    <Badge variant='secondary'>Recommended</Badge>
                  )}
                </CardHeader>
                <CardContent className='flex flex-1 flex-col gap-6'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-3xl font-bold'>{plan.price}</span>
                    <span className='text-muted-foreground'>{plan.period}</span>
                  </div>
                  <ul className='text-muted-foreground space-y-2 text-sm'>
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Button
                    className='mt-auto w-full rounded-xl'
                    variant={plan.recommended ? 'default' : 'outline'}
                  >
                    {plan.recommended ? 'Get Pro' : 'Select'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className='space-y-4'>
          <h2 className='text-lg font-semibold'>Feature comparison</h2>
          <div className='border-border overflow-hidden rounded-2xl border'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-border bg-muted/50 border-b'>
                  <th className='px-4 py-3 text-left font-medium'>Feature</th>
                  <th className='px-4 py-3 text-center font-medium'>Starter</th>
                  <th className='px-4 py-3 text-center font-medium'>Pro</th>
                  <th className='px-4 py-3 text-center font-medium'>
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row) => (
                  <tr
                    key={row.feature}
                    className='border-border border-b last:border-0'
                  >
                    <td className='px-4 py-3 font-medium'>{row.feature}</td>
                    <td className='text-muted-foreground px-4 py-3 text-center'>
                      {row.starter}
                    </td>
                    <td className='text-muted-foreground px-4 py-3 text-center'>
                      {row.pro}
                    </td>
                    <td className='text-muted-foreground px-4 py-3 text-center'>
                      {row.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
