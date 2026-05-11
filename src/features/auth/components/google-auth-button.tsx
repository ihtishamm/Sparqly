'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useAuthService } from '../api/auth-service';

export default function GoogleSignInButton() {
  const { googleLoginMutation } = useAuthService();

  return (
    <Button
      className='w-full'
      variant='outline'
      type='button'
      onClick={() => googleLoginMutation.mutate()}
      disabled={googleLoginMutation.isPending}
    >
      <Icons.google className='mr-2 h-4 w-4' />
      Continue with Google
    </Button>
  );
}
