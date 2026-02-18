export type PlanId = 'starter' | 'pro' | 'enterprise';

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  recommended?: boolean;
  features: string[];
};

export const MOCK_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/month',
    features: [
      'Up to 10 posts/month',
      '1 platform',
      'Basic analytics',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/month',
    recommended: true,
    features: [
      'Up to 50 posts/month',
      'All platforms',
      'Advanced analytics',
      'AI repurposing',
      'Priority support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    features: [
      'Unlimited posts',
      'All platforms',
      'Custom analytics',
      'API access',
      'Dedicated success manager',
      'SLA guarantee'
    ]
  }
];

export const MOCK_CURRENT_PLAN = {
  id: 'starter' as PlanId,
  name: 'Starter',
  renewalDate: 'March 19, 2025',
  usagePercent: 65,
  usageLabel: '32 of 50 posts used this period'
};

export const COMPARISON_FEATURES = [
  {
    feature: 'Posts per month',
    starter: '10',
    pro: '50',
    enterprise: 'Unlimited'
  },
  { feature: 'Platforms', starter: '1', pro: 'All', enterprise: 'All' },
  { feature: 'AI repurposing', starter: '—', pro: 'Yes', enterprise: 'Yes' },
  {
    feature: 'Analytics',
    starter: 'Basic',
    pro: 'Advanced',
    enterprise: 'Custom'
  },
  {
    feature: 'Support',
    starter: 'Email',
    pro: 'Priority',
    enterprise: 'Dedicated'
  }
];
