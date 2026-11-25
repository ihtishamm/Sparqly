import { describe, expect, it } from 'vitest';
import type { PostPerformance } from '@/lib/api/types';
import { engagementRate, sortPosts } from './performance-tables';

const post = (over: Partial<PostPerformance>): PostPerformance => ({
  id: 'p',
  title: null,
  contentId: null,
  variantType: null,
  platform: 'linkedin',
  accountId: 'a',
  accountName: null,
  postUrl: null,
  publishedAt: '2026-11-01T00:00:00Z',
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  viewsInRange: 0,
  lastSyncedAt: null,
  ...over
});

describe('sortPosts', () => {
  it('sorts by the chosen metric, newest first on ties', () => {
    const sorted = sortPosts(
      [
        post({ id: 'old', likes: 5, publishedAt: '2026-10-01T00:00:00Z' }),
        post({ id: 'top', likes: 9 }),
        post({ id: 'new', likes: 5, publishedAt: '2026-11-20T00:00:00Z' })
      ],
      'likes'
    );
    expect(sorted.map((p) => p.id)).toEqual(['top', 'new', 'old']);
  });
});

describe('engagementRate', () => {
  it('is interactions per view, as a percentage', () => {
    expect(
      engagementRate({ views: 200, likes: 6, comments: 2, shares: 2 })
    ).toBe(5);
    expect(engagementRate({ views: 0, likes: 3, comments: 0, shares: 0 })).toBe(
      0
    );
  });
});
