'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_CONNECTIONS } from '../constants/mock-connections';
import { Icons } from '@/components/icons';

const PLATFORM_ICONS: Record<string, keyof typeof Icons> = {
  instagram: 'media',
  twitter: 'twitter',
  linkedin: 'user',
  tiktok: 'media'
};

export default function ConnectionsViewPage() {
  const [connections, setConnections] = React.useState(MOCK_CONNECTIONS);

  const toggleConnection = (id: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'connected' ? 'disconnected' : 'connected',
              account:
                c.status === 'connected'
                  ? undefined
                  : c.id === 'instagram'
                    ? '@sparqly_app'
                    : 'sparqly_app'
            }
          : c
      )
    );
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
          {connections.map((platform) => {
            const Icon = Icons[PLATFORM_ICONS[platform.icon] ?? 'media'];
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
                      {platform.account && platform.status === 'connected' && (
                        <p className='text-muted-foreground mt-2 text-sm'>
                          Connected as {platform.account}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Badge
                      variant={
                        platform.status === 'connected'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {platform.status === 'connected'
                        ? 'Connected'
                        : 'Not connected'}
                    </Badge>
                    <Button
                      variant={
                        platform.status === 'connected' ? 'outline' : 'default'
                      }
                      size='sm'
                      className='rounded-lg'
                      onClick={() => toggleConnection(platform.id)}
                    >
                      {platform.status === 'connected'
                        ? 'Disconnect'
                        : 'Connect'}
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
