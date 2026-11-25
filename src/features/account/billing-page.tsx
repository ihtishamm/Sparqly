'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Coins, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBody, PageHeader } from '@/components/common/page-header';
import { ErrorState, ListSkeleton } from '@/components/common/states';
import {
  useBillingPortal,
  useCheckout,
  usePlans,
  useTransactions,
  useWallet
} from '@/lib/api/hooks/account';
import type { CreditTransaction, Plan, Wallet } from '@/lib/api/types';
import { dateTime, money, shortDate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Toasts the Stripe Checkout outcome once, then cleans the URL. */
function useCheckoutResult() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const shown = useRef(false);
  useEffect(() => {
    const result = params.get('checkout');
    if (!result || shown.current) return;
    shown.current = true;
    if (result === 'success') {
      toast.success('Payment received', {
        description: 'Your credits update as soon as Stripe confirms it.'
      });
      // The webhook can land a moment after the redirect.
      setTimeout(
        () => queryClient.invalidateQueries({ queryKey: ['billing'] }),
        3000
      );
    } else {
      toast('Checkout cancelled', { description: 'You weren’t charged.' });
    }
    router.replace(pathname, { scroll: false });
  }, [params, pathname, router, queryClient]);
}

function WalletCard({ wallet }: { wallet: Wallet }) {
  const portal = useBillingPortal();
  const parts = [
    { label: 'Plan', value: wallet.planCredits },
    { label: 'Rolled over', value: wallet.rolledOverCredits },
    { label: 'Extra', value: wallet.extraCredits + wallet.proratedCredits },
    { label: 'Used', value: -wallet.usageCount }
  ].filter((p) => p.value !== 0);
  const subscribed = !!wallet.priceId;

  return (
    <section className='bg-card grid gap-6 rounded-xl border p-5 md:grid-cols-[1fr_auto]'>
      <div className='space-y-4'>
        <div className='space-y-1'>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <Coins className='size-3.5' aria-hidden /> Credits available
          </p>
          <p className='tnum text-4xl leading-none font-semibold tracking-tight'>
            {wallet.balance}
          </p>
        </div>
        {parts.length > 0 && (
          <dl className='text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-xs'>
            {parts.map((p) => (
              <div key={p.label} className='flex gap-1.5'>
                <dt>{p.label}</dt>
                <dd className='tnum text-foreground'>
                  {p.value > 0 ? p.value : `−${-p.value}`}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p className='text-muted-foreground text-xs'>
          Each repurpose run, generation, export or scheduled post uses 1
          credit. Failed runs are refunded.
        </p>
      </div>
      <div className='flex flex-col items-start gap-2 md:items-end'>
        {wallet.currentPeriodEnd && (
          <p className='text-muted-foreground text-xs'>
            {wallet.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
            {shortDate(wallet.currentPeriodEnd)}
          </p>
        )}
        {wallet.cancelAtPeriodEnd && (
          <Badge variant='warning'>Cancels at period end</Badge>
        )}
        {wallet.status &&
          !['active', 'trialing'].includes(wallet.status) &&
          subscribed && (
            <Badge variant='destructive'>
              Payment {wallet.status.replace(/_/g, ' ')}
            </Badge>
          )}
        {subscribed && (
          <Button
            variant='outline'
            size='sm'
            loading={portal.isPending}
            onClick={() => portal.mutate()}
          >
            Manage billing <ExternalLink />
          </Button>
        )}
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  current,
  pending,
  onChoose
}: {
  plan: Plan;
  current: boolean;
  pending: boolean;
  onChoose: () => void;
}) {
  const perCredit = plan.credits ? plan.price / plan.credits : 0;
  return (
    <div
      className={cn(
        'bg-card flex flex-col gap-4 rounded-xl border p-4',
        current && 'border-primary/60 shadow-[0_0_0_1px_var(--primary)]'
      )}
    >
      <div className='flex items-center justify-between'>
        <p className='font-medium'>{plan.name}</p>
        {current && <Badge variant='accent'>Current plan</Badge>}
      </div>
      <div>
        <p className='tnum text-2xl font-semibold tracking-tight'>
          {money(plan.price)}
          {plan.mode === 'subscription' && (
            <span className='text-muted-foreground text-[13px] font-normal'>
              {' '}
              / month
            </span>
          )}
        </p>
        <p className='text-muted-foreground text-xs'>
          {plan.credits} credits
          {perCredit ? ` · ${money(Number(perCredit.toFixed(2)))} each` : ''}
        </p>
      </div>
      <ul className='text-muted-foreground space-y-1.5 text-[13px]'>
        <li className='flex gap-2'>
          <Check
            className='text-success mt-0.5 size-3.5 shrink-0'
            aria-hidden
          />
          {plan.mode === 'subscription'
            ? `${plan.credits} credits every month`
            : 'Credits never expire'}
        </li>
        {plan.mode === 'subscription' && (
          <li className='flex gap-2'>
            <Check
              className='text-success mt-0.5 size-3.5 shrink-0'
              aria-hidden
            />
            Unused credits roll over
          </li>
        )}
      </ul>
      <Button
        className='mt-auto'
        variant={current ? 'outline' : 'default'}
        disabled={current}
        loading={pending}
        onClick={onChoose}
      >
        {current
          ? 'Your plan'
          : plan.mode === 'subscription'
            ? 'Choose plan'
            : 'Buy credits'}
      </Button>
    </div>
  );
}

function TransactionRow({ tx }: { tx: CreditTransaction }) {
  const negative = tx.type === 'usage' || tx.amount < 0;
  const amount = Math.abs(tx.amount);
  return (
    <li className='flex items-center gap-3 px-4 py-2.5'>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px]'>{tx.description || tx.type}</p>
        <p className='text-muted-foreground text-xs'>
          {dateTime(tx.createdAt)}
        </p>
      </div>
      <span
        className={cn(
          'tnum text-[13px] font-medium',
          negative ? 'text-muted-foreground' : 'text-success'
        )}
      >
        {negative ? '−' : '+'}
        {amount}
      </span>
    </li>
  );
}

export function BillingPage() {
  useCheckoutResult();
  const wallet = useWallet();
  const plans = usePlans();
  const transactions = useTransactions();
  const checkout = useCheckout();

  const subscriptions =
    plans.data?.filter((p) => p.mode === 'subscription') ?? [];
  const packs = plans.data?.filter((p) => p.mode === 'payment') ?? [];

  const planGrid = (list: Plan[]) => (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {list.map((plan) => (
        <PlanCard
          key={plan.priceId}
          plan={plan}
          current={
            plan.mode === 'subscription' &&
            wallet.data?.priceId === plan.priceId
          }
          pending={
            checkout.isPending && checkout.variables?.priceId === plan.priceId
          }
          onChoose={() =>
            checkout.mutate({ priceId: plan.priceId, mode: plan.mode })
          }
        />
      ))}
    </div>
  );

  return (
    <PageBody>
      <PageHeader
        title='Billing'
        description='Your credits, plan and payment history.'
      />

      {wallet.isPending ? (
        <Skeleton className='h-36 rounded-xl' />
      ) : wallet.isError ? (
        <ErrorState error={wallet.error} onRetry={() => wallet.refetch()} />
      ) : (
        <WalletCard wallet={wallet.data} />
      )}

      {plans.isError ? (
        <ErrorState
          error={plans.error}
          title='Couldn’t load plans'
          onRetry={() => plans.refetch()}
        />
      ) : plans.isPending ? (
        <Skeleton className='h-56 rounded-xl' />
      ) : (
        <>
          {subscriptions.length > 0 && (
            <section className='space-y-3'>
              <h2 className='text-[13px] font-medium'>Plans</h2>
              {planGrid(subscriptions)}
            </section>
          )}
          {packs.length > 0 && (
            <section className='space-y-3'>
              <h2 className='text-[13px] font-medium'>Credit packs</h2>
              {planGrid(packs)}
            </section>
          )}
        </>
      )}

      <section className='space-y-3'>
        <h2 className='text-[13px] font-medium'>History</h2>
        {transactions.isPending ? (
          <ListSkeleton rows={4} />
        ) : transactions.isError ? (
          <ErrorState
            error={transactions.error}
            onRetry={() => transactions.refetch()}
          />
        ) : !transactions.data.data.length ? (
          <p className='text-muted-foreground text-[13px]'>
            No credit activity yet.
          </p>
        ) : (
          <ul className='divide-y rounded-xl border'>
            {transactions.data.data.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </section>
    </PageBody>
  );
}
