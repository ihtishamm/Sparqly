import { Instagram, Linkedin, Youtube, type LucideIcon } from 'lucide-react';
import type { Platform, PlatformAccount } from './api/types';

type PlatformMeta = {
  label: string;
  icon: LucideIcon;
  /** Brand colour, used only for the small platform mark. */
  color: string;
  /** Can publish a text-only post (no video). */
  supportsText: boolean;
  description: string;
};

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    color: '#ff3b30',
    supportsText: false,
    description: 'Publish clips as YouTube Shorts.'
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: '#e1306c',
    supportsText: false,
    description: 'Publish clips as Reels to a business account.'
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    color: '#0a66c2',
    supportsText: true,
    description: 'Publish posts and clips to your profile.'
  }
};

export const PLATFORM_ORDER: Platform[] = ['youtube', 'instagram', 'linkedin'];

export function platformMeta(platform: string): PlatformMeta {
  return (
    PLATFORMS[platform as Platform] ?? {
      label: platform,
      icon: Youtube,
      color: '#8a8f98',
      supportsText: false,
      description: ''
    }
  );
}

export function needsReconnect(account: PlatformAccount) {
  return !!account.needsReconnect;
}
