'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MoreHorizontal, Plus, RefreshCw, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PageBody, PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ErrorState, ListSkeleton } from '@/components/common/states';
import { PlatformMark } from '@/components/common/platform-mark';
import {
  useAccounts,
  useConnectAccount,
  useDisconnectAccount
} from '@/lib/api/hooks/publishing';
import type { Platform, PlatformAccount } from '@/lib/api/types';
import { relativeTime } from '@/lib/format';
import { PLATFORM_ORDER, platformMeta } from '@/lib/platforms';

const ERRORS: Record<string, string> = {
  access_denied: 'You cancelled the connection, or didn’t grant access.',
  connection_failed: 'The platform didn’t accept the connection. Try again.'
};

/** Shows the result of the OAuth round trip once, then cleans the URL. */
function useConnectResult() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);
  useEffect(() => {
    const success = params.get('success');
    if (success === null || shown.current) return;
    shown.current = true;
    const label = platformMeta(params.get('platform') ?? '').label;
    if (success === 'true') {
      toast.success(`${label} connected`);
    } else {
      toast.error(`Couldn’t connect ${label}`, {
        description:
          ERRORS[params.get('error') ?? ''] ?? ERRORS.connection_failed
      });
    }
    router.replace(pathname, { scroll: false });
  }, [params, pathname, router]);
}

function AccountRow({
  account,
  onReconnect,
  onDisconnect,
  reconnecting
}: {
  account: PlatformAccount;
  onReconnect: () => void;
  onDisconnect: () => void;
  reconnecting: boolean;
}) {
  return (
    <li className='flex items-center gap-3 px-4 py-2.5'>
      <div className='bg-secondary text-muted-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium'>
        {(account.accountName || '?').charAt(0).toUpperCase()}
      </div>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] font-medium'>
          {account.accountName ||
            account.accountIdentifier ||
            'Connected account'}
        </p>
        <p className='text-muted-foreground text-xs'>
          Connected {relativeTime(account.createdAt)}
        </p>
      </div>
      {account.needsReconnect ? (
        <>
          <Badge variant='warning'>Reconnect needed</Badge>
          <Button
            size='sm'
            variant='outline'
            onClick={onReconnect}
            loading={reconnecting}
          >
            <RefreshCw /> Reconnect
          </Button>
        </>
      ) : (
        <Badge variant='success'>Active</Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon-sm' aria-label='Account actions'>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem variant='destructive' onSelect={onDisconnect}>
            <Unplug /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function ConnectionsPage() {
  useConnectResult();
  const accounts = useAccounts();
  const connect = useConnectAccount();
  const disconnect = useDisconnectAccount();
  const [removing, setRemoving] = useState<PlatformAccount | null>(null);
  const list = accounts.data?.data ?? [];

  return (
    <PageBody className='max-w-3xl'>
      <PageHeader
        title='Connections'
        description='Connect the accounts Sparqly publishes to. You can connect more than one account per platform.'
      />

      {accounts.isPending ? (
        <ListSkeleton rows={3} />
      ) : accounts.isError ? (
        <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} />
      ) : (
        <div className='space-y-4'>
          {PLATFORM_ORDER.map((platform: Platform) => {
            const meta = platformMeta(platform);
            const connected = list.filter((a) => a.platform === platform);
            const pending = connect.isPending && connect.variables === platform;
            return (
              <section
                key={platform}
                className='bg-card overflow-hidden rounded-xl border'
              >
                <header className='flex items-center gap-3 px-4 py-3'>
                  <PlatformMark platform={platform} size='lg' />
                  <div className='min-w-0 flex-1'>
                    <h2 className='font-medium'>{meta.label}</h2>
                    <p className='text-muted-foreground text-[13px]'>
                      {meta.description}
                    </p>
                  </div>
                  <Button
                    size='sm'
                    variant={connected.length ? 'outline' : 'default'}
                    loading={pending}
                    onClick={() => connect.mutate(platform)}
                  >
                    {!pending && <Plus />}
                    {connected.length ? 'Add account' : 'Connect'}
                  </Button>
                </header>
                {connected.length > 0 && (
                  <ul className='divide-y border-t'>
                    {connected.map((account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        reconnecting={pending}
                        onReconnect={() => connect.mutate(platform)}
                        onDisconnect={() => setRemoving(account)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        destructive
        title={`Disconnect ${removing?.accountName || 'this account'}?`}
        description='Its scheduled posts and their history are removed from Sparqly. Anything already published stays on the platform.'
        confirmLabel='Disconnect'
        onConfirm={async () => {
          if (!removing) return;
          await disconnect.mutateAsync(removing.id);
          toast.success('Account disconnected');
        }}
      />
    </PageBody>
  );
}
