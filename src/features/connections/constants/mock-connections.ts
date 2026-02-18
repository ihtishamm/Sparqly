export type ConnectionStatus = 'connected' | 'disconnected';

export type PlatformConnection = {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: ConnectionStatus;
  account?: string;
};

export const MOCK_CONNECTIONS: PlatformConnection[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram account to post and schedule content.',
    icon: 'instagram',
    status: 'connected',
    account: '@sparqly_app'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Connect Twitter to share and repurpose content.',
    icon: 'twitter',
    status: 'connected',
    account: 'sparqly_app'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect LinkedIn for professional content and analytics.',
    icon: 'linkedin',
    status: 'disconnected'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Connect TikTok to publish short-form video content.',
    icon: 'tiktok',
    status: 'disconnected'
  }
];
