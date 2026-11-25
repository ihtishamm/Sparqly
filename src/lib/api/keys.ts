/**
 * Query keys. Each domain has one root so invalidating it refreshes every
 * list and detail under it, and detail keys never collide with list keys.
 */
export const keys = {
  me: ['me'] as const,

  projects: {
    all: ['projects'] as const,
    list: (search: string) => ['projects', 'list', { search }] as const,
    detail: (id: string) => ['projects', 'detail', id] as const
  },

  jobs: {
    all: ['ai-jobs'] as const,
    list: (limit: number) => ['ai-jobs', 'list', { limit }] as const,
    detail: (id: string) => ['ai-jobs', 'detail', id] as const
  },

  editor: {
    timeline: (id: string) => ['editor', 'timeline', id] as const,
    renders: (compositionId: string) =>
      ['editor', 'renders', compositionId] as const
  },

  posts: {
    all: ['scheduled-posts'] as const,
    range: (from: string, to: string) =>
      ['scheduled-posts', 'range', { from, to }] as const,
    upcoming: ['scheduled-posts', 'upcoming'] as const,
    published: ['scheduled-posts', 'published'] as const
  },

  accounts: ['platform-accounts'] as const,

  billing: {
    wallet: ['billing', 'wallet'] as const,
    plans: ['billing', 'plans'] as const,
    transactions: ['billing', 'transactions'] as const
  },

  analytics: (startDate: string, endDate: string) =>
    ['analytics', 'overview', { startDate, endDate }] as const,
  analyticsPosts: (startDate: string, endDate: string) =>
    ['analytics', 'posts', { startDate, endDate }] as const,
  analyticsAccounts: (startDate: string, endDate: string) =>
    ['analytics', 'accounts', { startDate, endDate }] as const,

  activity: (limit: number) => ['activity', { limit }] as const
};
