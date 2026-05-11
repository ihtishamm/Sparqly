'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTiktok,
  IconCheck,
  IconPlugConnected,
  IconShieldCheck,
  IconActivity,
  IconArrowRight
} from '@tabler/icons-react';
import { usePlatformAccounts } from '../api/platform-accounts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: IconBrandYoutube,
    color: 'bg-red-500',
    description: 'Publish Shorts and videos directly to your channel.'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: IconBrandLinkedin,
    color: 'bg-blue-600',
    description: 'Share professional updates and articles.'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: IconBrandInstagram,
    color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
    description: 'Post Reels and photos to your feed.'
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: IconBrandTwitter,
    color: 'bg-stone-900',
    description: 'Engage with your audience through threads and posts.'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: IconBrandTiktok,
    color: 'bg-black',
    description: 'Sync viral short-form content to your profile.'
  }
];

export default function ConnectionsViewPage() {
  const { useGetAccounts, connectMutation, disconnectMutation } =
    usePlatformAccounts();
  const { data, isLoading } = useGetAccounts();
  const realAccounts = data?.data || [];

  const handleConnect = async (platformId: string) => {
    connectMutation.mutate(platformId);
  };

  const handleDisconnect = async (id: string) => {
    if (confirm('Are you sure you want to disconnect this account?')) {
      disconnectMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Account disconnected');
        }
      });
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-10 pb-12'>
        <header className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1.5'>
            <h1 className='text-3xl font-bold tracking-tight md:text-5xl'>
              Digital <span className='text-primary'>Ecosystem</span>
            </h1>
            <p className='text-muted-foreground max-w-2xl text-lg'>
              Connect your social platforms to enable AI-powered publishing and
              real-time analytics.
            </p>
          </div>
          <div className='bg-muted/30 border-primary/10 flex items-center gap-2 rounded-2xl border px-4 py-2'>
            <IconShieldCheck className='h-5 w-5 text-green-500' />
            <span className='text-sm font-medium'>Bank-grade Security</span>
          </div>
        </header>

        <div className='grid gap-8 lg:grid-cols-[1fr_300px]'>
          <div className='space-y-6'>
            <h2 className='flex items-center gap-2 text-xl font-bold'>
              <IconPlugConnected className='text-primary h-5 w-5' /> Available
              Integrations
            </h2>

            <div className='grid gap-4'>
              <AnimatePresence mode='popLayout'>
                {isLoading
                  ? [1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-32 w-full rounded-3xl' />
                    ))
                  : PLATFORMS.map((platform) => {
                      const Icon = platform.icon;
                      const connectedAccount = realAccounts.find(
                        (acc) => acc.platform === platform.id
                      );
                      const isConnected = !!connectedAccount;

                      return (
                        <motion.div
                          key={platform.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          layout
                        >
                          <Card
                            className={`rounded-[32px] border-none transition-all duration-300 ${isConnected ? 'bg-primary/5 shadow-primary/5 shadow-xl' : 'bg-muted/20 hover:bg-muted/30'}`}
                          >
                            <CardHeader className='flex flex-row items-center justify-between gap-4 p-6'>
                              <div className='flex items-center gap-5'>
                                <div
                                  className={`${platform.color} rounded-2xl p-3 shadow-lg`}
                                >
                                  <Icon className='h-7 w-7 text-white' />
                                </div>
                                <div>
                                  <h3 className='text-xl font-bold'>
                                    {platform.name}
                                  </h3>
                                  <p className='text-muted-foreground mt-0.5 max-w-sm text-sm'>
                                    {platform.description}
                                  </p>
                                </div>
                              </div>
                              <div className='flex items-center gap-4'>
                                {isConnected ? (
                                  <div className='flex flex-col items-end'>
                                    <Badge className='flex items-center gap-1 rounded-full border-none bg-green-500/10 px-4 py-1 text-green-600'>
                                      <div className='h-1.5 w-1.5 animate-pulse rounded-full bg-green-500' />
                                      Active
                                    </Badge>
                                    <p className='text-muted-foreground mt-2 font-mono text-[10px] tracking-wider uppercase'>
                                      {connectedAccount.accountName}
                                    </p>
                                  </div>
                                ) : (
                                  <Badge
                                    variant='outline'
                                    className='border-muted-foreground/20 text-muted-foreground rounded-full px-4 py-1'
                                  >
                                    Not Connected
                                  </Badge>
                                )}

                                <Button
                                  variant={isConnected ? 'ghost' : 'default'}
                                  size='lg'
                                  className={`h-14 rounded-2xl px-8 font-bold ${!isConnected && 'shadow-primary/20 shadow-lg'}`}
                                  onClick={() =>
                                    isConnected
                                      ? handleDisconnect(connectedAccount.id)
                                      : handleConnect(platform.id)
                                  }
                                  disabled={
                                    connectMutation.isPending ||
                                    disconnectMutation.isPending
                                  }
                                >
                                  {isConnected ? (
                                    <span className='text-destructive'>
                                      Disconnect
                                    </span>
                                  ) : (
                                    <span className='flex items-center gap-2'>
                                      Connect{' '}
                                      <IconArrowRight className='h-4 w-4' />
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </CardHeader>
                          </Card>
                        </motion.div>
                      );
                    })}
              </AnimatePresence>
            </div>
          </div>

          <aside className='space-y-6'>
            <Card className='border-primary/10 from-primary/5 overflow-hidden rounded-3xl bg-gradient-to-b to-transparent'>
              <CardHeader>
                <div className='bg-primary/10 mb-2 w-fit rounded-2xl p-3'>
                  <IconActivity className='text-primary h-6 w-6' />
                </div>
                <h3 className='text-lg font-bold'>Platform Health</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  All social platform APIs are currently operational and
                  synchronized.
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>API Status</span>
                  <span className='font-bold text-green-500'>99.9%</span>
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>Last Sync</span>
                  <span className='font-mono'>Just now</span>
                </div>
                <div className='pt-2'>
                  <div className='bg-muted flex h-1.5 w-full gap-1 overflow-hidden rounded-full'>
                    <div className='flex-1 bg-green-500' />
                    <div className='flex-1 bg-green-500' />
                    <div className='flex-1 bg-green-500' />
                    <div className='flex-1 bg-green-500' />
                    <div className='flex-1 bg-green-500/50' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='rounded-3xl border-none bg-stone-900 p-6 text-white'>
              <h4 className='mb-2 font-bold'>Need Help?</h4>
              <p className='mb-4 text-xs leading-relaxed text-stone-400'>
                Encountering issues connecting your social accounts? Check our
                documentation or contact support.
              </p>
              <Button
                variant='secondary'
                className='h-10 w-full rounded-xl text-xs'
              >
                Read Guide
              </Button>
            </Card>
          </aside>
        </div>
      </div>
    </PageContainer>
  );
}
