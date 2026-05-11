'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_CONNECTIONS } from '../constants/mock-connections';
import { Icons } from '@/components/icons';
import { usePlatformAccounts } from '../api/platform-accounts';
import { toast } from 'sonner';

const PLATFORM_ICONS: Record<string, keyof typeof Icons> = {
  instagram: 'media',
  twitter: 'twitter',
  linkedin: 'user',
  tiktok: 'media',
  youtube: 'media'
};

export default function ConnectionsViewPage() {
  const { useGetAccounts, connectMutation, disconnectMutation } =
    usePlatformAccounts();
  const { data, isLoading } = useGetAccounts();
  const realAccounts = data?.data || [];

  const handleConnect = async (platformId: string) => {
    const platform = platformId === 'youtube-shorts' ? 'youtube' : platformId;
    connectMutation.mutate(platform);
  };

  const handleDisconnect = async (id: string) => {
    disconnectMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Account disconnected');
      }
    });
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-6'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Social Media Connections
          </h1>
          <p className='text-muted-foreground'>
            Connect your accounts to publish and manage content in one place.
          </p>
        </header>

        <div className='space-y-4'>
          {MOCK_CONNECTIONS.map((platform) => {
            const Icon = Icons[PLATFORM_ICONS[platform.id] ?? 'media'];
            const connectedAccount = realAccounts.find(
              (acc) =>
                acc.platform ===
                (platform.id === 'youtube-shorts' ? 'youtube' : platform.id)
            );
            const isConnected = !!connectedAccount;

            return (
              <Card key={platform.id} className='rounded-2xl'>
                <CardHeader className='flex flex-row items-start justify-between gap-4'>
                  <div className='flex gap-4'>
                    <div className='bg-muted flex size-12 shrink-0 items-center justify-center rounded-xl'>
                      <Icon className='text-muted-foreground size-6' />
                    </div>
                    <div>
                      <h3 className='font-semibold'>{platform.name}</h3>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {platform.description}
                      </p>
                      {isConnected && (
                        <p className='text-muted-foreground mt-2 text-sm font-medium text-green-500'>
                          Connected as {connectedAccount.accountName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                      {isConnected ? 'Connected' : 'Not connected'}
                    </Badge>
                    <Button
                      variant={isConnected ? 'outline' : 'default'}
                      size='sm'
                      className='rounded-lg'
                      onClick={() =>
                        isConnected
                          ? handleDisconnect(connectedAccount.id)
                          : handleConnect(platform.id)
                      }
                      disabled={
                        isLoading ||
                        connectMutation.isPending ||
                        disconnectMutation.isPending
                      }
                    >
                      {isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
