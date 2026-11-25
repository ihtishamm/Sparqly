'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Film, Link2, Linkedin, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PageBody, PageHeader } from '@/components/common/page-header';
import { FormAlert } from '@/components/common/states';
import { CreditCost, OutOfCredits } from '@/components/common/credits-notice';
import { ApiError } from '@/lib/api/errors';
import { useStartRepurpose, type OutputType } from '@/lib/api/hooks/projects';
import { applyApiErrors } from '@/lib/forms';
import { cn } from '@/lib/utils';

const OUTPUTS: Array<{
  id: OutputType;
  label: string;
  description: string;
  icon: typeof Film;
}> = [
  {
    id: 'short-clips',
    label: 'Short clips',
    description: 'Vertical 9:16 highlights with captions',
    icon: Film
  },
  {
    id: 'blog-post',
    label: 'Blog post',
    description: 'A long-form article from the transcript',
    icon: FileText
  },
  {
    id: 'linkedin',
    label: 'LinkedIn post',
    description: 'A ready-to-publish professional post',
    icon: Linkedin
  },
  {
    id: 'threads',
    label: 'Thread',
    description: 'A 5–7 part thread for X or Threads',
    icon: MessagesSquare
  }
];

const TONES = [
  { value: 'engaging', label: 'Engaging' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'educational', label: 'Educational' },
  { value: 'bold', label: 'Bold' }
];

const schema = z.object({
  sourceUrl: z.string().trim().url('Paste a full link, starting with https://'),
  title: z.string().trim().max(255).optional(),
  outputs: z
    .array(z.enum(['short-clips', 'blog-post', 'linkedin', 'threads']))
    .min(1, 'Pick at least one output'),
  tone: z.string()
});
type Values = z.infer<typeof schema>;

export function RepurposePage() {
  const router = useRouter();
  const start = useStartRepurpose();
  const [outOfCredits, setOutOfCredits] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceUrl: '',
      title: '',
      outputs: ['short-clips', 'linkedin'],
      tone: 'engaging'
    }
  });

  async function onSubmit(values: Values) {
    setOutOfCredits(false);
    try {
      const project = await start.mutateAsync({
        sourceUrl: values.sourceUrl,
        title: values.title || undefined,
        outputs: values.outputs,
        tone: values.tone
      });
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.isInsufficientCredits) {
        setOutOfCredits(true);
        return;
      }
      applyApiErrors(error, form.setError, ['sourceUrl', 'title']);
    }
  }

  return (
    <PageBody className='max-w-2xl'>
      <PageHeader
        title='Repurpose a video'
        description='Paste a link. Sparqly transcribes it, finds the strongest moments and turns them into clips and posts.'
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
          noValidate
        >
          {outOfCredits && <OutOfCredits />}
          <FormAlert message={form.formState.errors.root?.server?.message} />

          <FormField
            control={form.control}
            name='sourceUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video link</FormLabel>
                <div className='relative'>
                  <Link2
                    className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
                    aria-hidden
                  />
                  <FormControl>
                    <Input
                      type='url'
                      inputMode='url'
                      autoFocus
                      placeholder='https://www.youtube.com/watch?v=…'
                      className='h-10 pl-9'
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormDescription className='text-xs'>
                  YouTube, Vimeo, TikTok, Instagram or a direct link to a video
                  file.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='outputs'
            render={({ field }) => (
              <FormItem>
                <FormLabel>What should we make?</FormLabel>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {OUTPUTS.map((output) => {
                    const checked = field.value.includes(output.id);
                    const Icon = output.icon;
                    return (
                      <label
                        key={output.id}
                        className={cn(
                          'bg-card hover:border-input flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                          checked &&
                            'border-primary/60 bg-primary/5 hover:border-primary/60'
                        )}
                      >
                        <Checkbox
                          className='mt-0.5'
                          checked={checked}
                          onCheckedChange={(on) =>
                            field.onChange(
                              on
                                ? [...field.value, output.id]
                                : field.value.filter((v) => v !== output.id)
                            )
                          }
                        />
                        <div className='min-w-0 space-y-0.5'>
                          <span className='flex items-center gap-1.5 text-[13px] font-medium'>
                            <Icon
                              className='text-muted-foreground size-3.5'
                              aria-hidden
                            />
                            {output.label}
                          </span>
                          <span className='text-muted-foreground block text-xs'>
                            {output.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='tone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Project name{' '}
                    <span className='text-muted-foreground font-normal'>
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='Named after the video' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex items-center justify-between gap-3 border-t pt-5'>
            <CreditCost />
            <Button
              type='submit'
              size='lg'
              loading={form.formState.isSubmitting}
            >
              Start repurposing
            </Button>
          </div>
        </form>
      </Form>
    </PageBody>
  );
}
