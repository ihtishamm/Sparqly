import { LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Tone =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'outline';

const STATUS: Record<string, { label: string; tone: Tone; spin?: boolean }> = {
  pending: { label: 'Queued', tone: 'outline', spin: true },
  processing: { label: 'Processing', tone: 'accent', spin: true },
  completed: { label: 'Ready', tone: 'success' },
  failed: { label: 'Failed', tone: 'destructive' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  published: { label: 'Published', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'outline' },
  draft: { label: 'Draft', tone: 'outline' }
};

/** Pipeline stages reported by repurpose jobs. */
export const STAGE_LABELS: Record<string, string> = {
  downloading: 'Downloading source',
  transcribing: 'Transcribing',
  detecting: 'Finding highlights',
  cutting: 'Cutting clips',
  writing: 'Writing posts',
  generating: 'Generating'
};

export function StatusBadge({
  status,
  label
}: {
  status: string;
  label?: string;
}) {
  const meta = STATUS[status] ?? { label: status, tone: 'default' as Tone };
  return (
    <Badge variant={meta.tone}>
      {meta.spin ? (
        <LoaderCircle className='animate-spin' aria-hidden />
      ) : (
        <span className='size-1.5 rounded-full bg-current' aria-hidden />
      )}
      {label ?? meta.label}
    </Badge>
  );
}
