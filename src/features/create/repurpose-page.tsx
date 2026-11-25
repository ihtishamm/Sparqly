'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileAudio,
  FileText,
  FileVideo,
  Film,
  Link2,
  Linkedin,
  MessagesSquare,
  Upload,
  X
} from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import { bytes } from '@/lib/format';
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

/** Matches the API: clips are cut from MP4; audio is transcribed as is. */
const ACCEPT = '.mp4,.mp3,.m4a,.wav,video/mp4,audio/mpeg,audio/mp4,audio/wav';
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function checkFile(file: File): string | null {
  if (!/\.(mp4|mp3|m4a|wav)$/i.test(file.name)) {
    return 'Upload an MP4 video, or MP3, M4A or WAV audio.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `This file is ${bytes(file.size)}. The limit is 500 MB.`;
  }
  return null;
}

function FilePicker({
  file,
  error,
  disabled,
  onChange
}: {
  file: File | null;
  error: string | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  if (file) {
    const Icon = /\.mp4$/i.test(file.name) ? FileVideo : FileAudio;
    return (
      <div className='bg-card flex items-center gap-3 rounded-lg border p-3'>
        <Icon className='text-muted-foreground size-5 shrink-0' aria-hidden />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] font-medium'>{file.name}</p>
          <p className='text-muted-foreground text-xs'>{bytes(file.size)}</p>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Remove file'
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          <X />
        </Button>
      </div>
    );
  }
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onChange(dropped);
      }}
      className={cn(
        'bg-card hover:border-input flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
        dragging && 'border-primary/60 bg-primary/5',
        error && 'border-destructive/60'
      )}
    >
      <Upload className='text-muted-foreground size-5' aria-hidden />
      <span className='text-[13px] font-medium'>
        Drop a file or <span className='text-primary'>browse</span>
      </span>
      <span className='text-muted-foreground text-xs'>
        MP4 video, or MP3, M4A or WAV audio · up to 500 MB
      </span>
      <input
        type='file'
        accept={ACCEPT}
        className='sr-only'
        aria-label='Video or audio file'
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

const schema = z.object({
  sourceUrl: z.string().trim(),
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
  const [mode, setMode] = useState<'link' | 'file'>('link');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceUrl: '',
      title: '',
      outputs: ['short-clips', 'linkedin'],
      tone: 'engaging'
    }
  });

  function pickFile(next: File | null) {
    setFile(next);
    setFileError(next ? checkFile(next) : null);
  }

  async function onSubmit(values: Values) {
    setOutOfCredits(false);
    if (
      mode === 'link' &&
      !z.string().url().safeParse(values.sourceUrl).success
    ) {
      form.setError('sourceUrl', {
        message: 'Paste a full link, starting with https://'
      });
      return;
    }
    if (mode === 'file') {
      const problem = file ? checkFile(file) : 'Choose a file to upload.';
      if (problem) {
        setFileError(problem);
        return;
      }
    }
    try {
      const project = await start.mutateAsync({
        ...(mode === 'file'
          ? { file: file!, onUploadProgress: setProgress }
          : { sourceUrl: values.sourceUrl }),
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
      if (error instanceof ApiError && error.fieldErrors.file) {
        setFileError(error.fieldErrors.file);
        return;
      }
      applyApiErrors(error, form.setError, ['sourceUrl', 'title']);
    } finally {
      setProgress(null);
    }
  }

  return (
    <PageBody className='max-w-2xl'>
      <PageHeader
        title='Repurpose a video'
        description='Paste a link or upload a file. Sparqly transcribes it, finds the strongest moments and turns them into clips and posts.'
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
          noValidate
        >
          {outOfCredits && <OutOfCredits />}
          <FormAlert message={form.formState.errors.root?.server?.message} />

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-[13px] font-medium'>Source</p>
              <ToggleGroup
                type='single'
                variant='outline'
                size='sm'
                value={mode}
                onValueChange={(v) => v && setMode(v as 'link' | 'file')}
                aria-label='Source type'
              >
                <ToggleGroupItem value='link' className='gap-1.5 px-3'>
                  <Link2 className='size-3.5' aria-hidden /> Link
                </ToggleGroupItem>
                <ToggleGroupItem value='file' className='gap-1.5 px-3'>
                  <Upload className='size-3.5' aria-hidden /> Upload
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {mode === 'link' ? (
              <FormField
                control={form.control}
                name='sourceUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='sr-only'>Video link</FormLabel>
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
                      YouTube, Vimeo, TikTok, Instagram or a direct link to a
                      video file.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className='space-y-2'>
                <FilePicker
                  file={file}
                  error={fileError}
                  disabled={progress !== null}
                  onChange={pickFile}
                />
                {fileError && (
                  <p className='text-destructive text-xs' role='alert'>
                    {fileError}
                  </p>
                )}
                {progress !== null && (
                  <div className='space-y-1' aria-live='polite'>
                    <Progress value={Math.round(progress * 100)} />
                    <p className='text-muted-foreground text-xs'>
                      {progress < 1
                        ? `Uploading… ${Math.round(progress * 100)}%`
                        : 'Upload complete. Starting the job…'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

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
                    <Input
                      placeholder={
                        mode === 'file'
                          ? 'Named after the file'
                          : 'Named after the video'
                      }
                      {...field}
                    />
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
