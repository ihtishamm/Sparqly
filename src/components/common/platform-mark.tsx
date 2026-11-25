import { platformMeta } from '@/lib/platforms';
import { cn } from '@/lib/utils';

/** Small square platform logo in its brand colour. */
export function PlatformMark({
  platform,
  size = 'md',
  className
}: {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const meta = platformMeta(platform);
  const Icon = meta.icon;
  return (
    <span
      title={meta.label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border',
        size === 'sm' && 'size-5 [&_svg]:size-3',
        size === 'md' && 'size-7 [&_svg]:size-3.5',
        size === 'lg' && 'size-9 rounded-lg [&_svg]:size-4.5',
        className
      )}
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${meta.color} 25%, transparent)`
      }}
    >
      <Icon aria-hidden />
      <span className='sr-only'>{meta.label}</span>
    </span>
  );
}
