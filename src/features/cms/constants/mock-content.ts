export type ContentStatus = 'draft' | 'scheduled' | 'published';

export type ContentItem = {
  id: string;
  title: string;
  thumbnail: string;
  platforms: ('instagram' | 'twitter' | 'linkedin' | 'tiktok')[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
};

export const MOCK_CONTENT: ContentItem[] = [
  {
    id: '1',
    title: 'Q1 Product Launch Announcement',
    thumbnail: 'https://api.slingacademy.com/public/sample-photos/1.jpeg',
    platforms: ['instagram', 'twitter', 'linkedin'],
    status: 'published',
    publishedAt: '2025-02-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Behind the Scenes: How We Build',
    thumbnail: 'https://api.slingacademy.com/public/sample-photos/2.jpeg',
    platforms: ['instagram', 'tiktok'],
    status: 'scheduled',
    scheduledAt: '2025-02-20T14:00:00Z'
  },
  {
    id: '3',
    title: '5 Tips for Better Content',
    thumbnail: 'https://api.slingacademy.com/public/sample-photos/3.jpeg',
    platforms: ['linkedin'],
    status: 'draft'
  },
  {
    id: '4',
    title: 'Customer Success Story',
    thumbnail: 'https://api.slingacademy.com/public/sample-photos/4.jpeg',
    platforms: ['twitter', 'linkedin'],
    status: 'published',
    publishedAt: '2025-02-10T09:00:00Z'
  },
  {
    id: '5',
    title: 'Weekly Roundup Feb 15',
    thumbnail: 'https://api.slingacademy.com/public/sample-photos/5.jpeg',
    platforms: ['instagram', 'twitter'],
    status: 'draft'
  }
];
