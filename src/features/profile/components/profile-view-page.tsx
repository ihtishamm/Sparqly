import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export default function ProfileViewPage() {
  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-start justify-between'>
        <Heading title='Profile' description='Manage your profile settings.' />
      </div>
      <Separator />
      <div className='py-4'>
        <p className='text-muted-foreground'>
          Profile management is currently being updated. Please check back
          later.
        </p>
      </div>
    </div>
  );
}
