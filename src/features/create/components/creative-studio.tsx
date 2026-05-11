'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconVideo,
  IconPhoto,
  IconFileText,
  IconSparkles,
  IconDownload,
  IconShare,
  IconWand,
  IconLoader2
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

import { useAuthStore } from '@/store/auth-store';
import { useAiJobs } from '../../repurpose/api/ai-jobs';
import { useSubscription } from '@/features/subscription/api/subscription';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type StudioMode = 'video' | 'image' | 'blog';

export function CreativeStudio() {
  const router = useRouter();
  const [mode, setMode] = React.useState<StudioMode>('video');
  const [result, setResult] = React.useState<string | null>(null);
  const { user } = useAuthStore();
  const { createJobMutation, useGetJob } = useAiJobs();
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const { data: activeJob } = useGetJob(activeJobId);

  const [prompt, setPrompt] = React.useState('');
  const [style, setStyle] = React.useState('cinematic');
  const [ratio, setRatio] = React.useState('9:16');
  const [tone, setTone] = React.useState('professional');

  const { useGetWallet } = useSubscription();
  const { data: wallet } = useGetWallet();
  const balance = wallet?.balance ?? 0;
  const hasEnoughCredits = balance >= 1;

  const handleGenerate = async () => {
    if (!user || !prompt || !hasEnoughCredits) return;

    setResult(null);
    try {
      const job = await createJobMutation.mutateAsync({
        jobType:
          mode === 'image'
            ? 'image_generation'
            : mode === 'blog'
              ? 'blog_generation'
              : 'script_generation',
        input: {
          prompt,
          style,
          ratio,
          tone,
          keywords: mode === 'blog' ? prompt.split(' ') : []
        },
        user: { id: user.id },
        status: 'pending'
      });
      setActiveJobId(job.id);
    } catch (error) {
      // Error handled by global cache
    }
  };

  // Monitor job status
  React.useEffect(() => {
    if (activeJob?.status === 'completed') {
      setResult('success');
    }
  }, [activeJob?.status]);

  const loading =
    createJobMutation.isPending ||
    (activeJobId && activeJob?.status === 'processing') ||
    activeJob?.status === 'queued';

  const jobResultContent = React.useMemo(() => {
    if (!activeJob || activeJob.status !== 'completed') return null;

    if (mode === 'image') return activeJob.output?.fileUrl;
    if (mode === 'blog')
      return typeof activeJob.output === 'string'
        ? activeJob.output
        : JSON.stringify(activeJob.output);
    return JSON.stringify(activeJob.output);
  }, [activeJob, mode]);

  return (
    <div className='flex flex-1 flex-col gap-6 overflow-hidden'>
      <Tabs
        defaultValue='video'
        className='w-full'
        onValueChange={(v) => {
          setMode(v as StudioMode);
          setResult(null);
          setActiveJobId(null);
        }}
      >
        <TabsList className='bg-muted/50 inline-flex gap-4 rounded-full p-1.5'>
          <TabsTrigger
            value='video'
            className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6'
          >
            <IconVideo className='mr-2 h-4 w-4' /> Video
          </TabsTrigger>
          <TabsTrigger
            value='image'
            className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6'
          >
            <IconPhoto className='mr-2 h-4 w-4' /> Images
          </TabsTrigger>
          <TabsTrigger
            value='blog'
            className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6'
          >
            <IconFileText className='mr-2 h-4 w-4' /> Blog Post
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className='grid flex-1 gap-6 overflow-hidden lg:grid-cols-[400px_1fr]'>
        {/* Parameters Sidebar */}
        <Card className='bg-muted/20 flex flex-col overflow-hidden rounded-3xl border-none'>
          <div className='flex-1 space-y-6 overflow-y-auto p-6'>
            <div className='space-y-4'>
              <h3 className='text-muted-foreground text-sm font-semibold tracking-wider uppercase'>
                Prompt
              </h3>
              <Textarea
                placeholder={`Describe the ${mode} you want to create...`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className='bg-background min-h-[150px] rounded-2xl border-none shadow-sm'
              />
            </div>

            <div className='space-y-4'>
              <h3 className='text-muted-foreground text-sm font-semibold tracking-wider uppercase'>
                Parameters
              </h3>
              <div className='grid gap-4'>
                <div className='space-y-2'>
                  <label className='text-xs font-medium'>Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className='rounded-xl'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='cinematic'>Cinematic</SelectItem>
                      <SelectItem value='minimalist'>Minimalist</SelectItem>
                      <SelectItem value='vibrant'>Vibrant</SelectItem>
                      <SelectItem value='dark'>Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode === 'video' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-medium'>Ratio</label>
                    <Select value={ratio} onValueChange={setRatio}>
                      <SelectTrigger className='rounded-xl'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='9:16'>9:16 (TikTok/Reel)</SelectItem>
                        <SelectItem value='16:9'>16:9 (YouTube)</SelectItem>
                        <SelectItem value='1:1'>1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {mode === 'blog' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-medium'>Tone</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className='rounded-xl'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='professional'>
                          Professional
                        </SelectItem>
                        <SelectItem value='casual'>Casual</SelectItem>
                        <SelectItem value='humorous'>Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='bg-background/50 space-y-3 border-t p-6'>
            {!hasEnoughCredits && (
              <div className='bg-destructive/10 border-destructive/20 rounded-xl border p-3'>
                <p className='text-destructive text-center text-[10px] font-bold tracking-widest uppercase'>
                  Insufficient Credits
                </p>
                <p className='text-muted-foreground mt-1 text-center text-[9px]'>
                  You need at least 1 credit to generate content.
                </p>
              </div>
            )}
            <Button
              className='shadow-primary/20 w-full rounded-2xl py-6 shadow-lg'
              onClick={handleGenerate}
              disabled={loading || !prompt || !hasEnoughCredits}
            >
              {loading ? (
                <>
                  <IconLoader2 className='mr-2 h-5 w-5 animate-spin' />{' '}
                  Generating...
                </>
              ) : (
                <>
                  <IconWand className='mr-2 h-5 w-5' /> Generate {mode}
                </>
              )}
            </Button>
            {!hasEnoughCredits && (
              <Button
                variant='link'
                className='h-auto w-full text-[10px]'
                onClick={() => router.push('/dashboard/subscription')}
              >
                Upgrade now to get more credits
              </Button>
            )}
          </div>
        </Card>

        {/* Preview Canvas */}
        <div className='bg-muted/10 border-muted-foreground/10 relative flex flex-col overflow-hidden rounded-3xl border-2 border-dashed'>
          <AnimatePresence mode='wait'>
            {!loading && !result && (
              <motion.div
                key='empty'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex flex-1 flex-col items-center justify-center p-12 text-center'
              >
                <div className='bg-primary/5 mb-6 rounded-full p-8'>
                  <IconSparkles className='text-primary h-16 w-16 animate-pulse' />
                </div>
                <h3 className='mb-2 text-2xl font-bold'>Ready to Create?</h3>
                <p className='text-muted-foreground max-w-md'>
                  Fill in the prompt on the left and select your parameters.
                  Your AI-generated {mode} will appear here.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key='loading'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex flex-1 flex-col items-center justify-center p-12'
              >
                <div className='w-full max-w-md space-y-4'>
                  <div className='flex flex-col items-center gap-4 text-center'>
                    <div className='relative h-20 w-20'>
                      <IconLoader2 className='text-primary/20 h-20 w-20 animate-spin' />
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <IconSparkles className='text-primary h-8 w-8 animate-pulse' />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <h4 className='text-xl font-bold'>
                        AI is working its magic
                      </h4>
                      <p className='text-muted-foreground text-sm'>
                        {activeJob?.status === 'processing'
                          ? 'Generating assets...'
                          : 'Queuing request...'}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={activeJob?.status === 'processing' ? 65 : 15}
                    className='h-2 rounded-full'
                  />
                  <div className='flex flex-col gap-2'>
                    <Skeleton className='h-4 w-full rounded-full' />
                    <Skeleton className='h-4 w-5/6 rounded-full' />
                  </div>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                key='result'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='flex flex-1 flex-col p-6'
              >
                <div className='mb-6 flex items-center justify-between'>
                  <div className='flex gap-2'>
                    <Badge variant='secondary' className='rounded-full px-4'>
                      Generated just now
                    </Badge>
                    <Badge
                      variant='outline'
                      className='border-primary/20 text-primary rounded-full px-4'
                    >
                      v1.0
                    </Badge>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='rounded-full'
                    >
                      <IconDownload className='h-5 w-5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='rounded-full'
                    >
                      <IconShare className='h-5 w-5' />
                    </Button>
                  </div>
                </div>

                <div className='bg-background shadow-primary/5 flex-1 overflow-hidden rounded-2xl shadow-2xl'>
                  {mode === 'blog' ? (
                    <RichTextEditor
                      value={jobResultContent || ''}
                      onChange={() => {}}
                      className='h-full border-none'
                    />
                  ) : (
                    <div className='flex h-full items-center justify-center bg-stone-900'>
                      {mode === 'video' ? (
                        <div className='group relative flex aspect-[9/16] h-4/5 items-center justify-center rounded-lg border border-white/10 bg-stone-800'>
                          <IconVideo className='h-12 w-12 text-white/20 transition-colors group-hover:text-white/40' />
                          <div className='absolute right-4 bottom-4 left-4 rounded-lg bg-black/50 p-3 backdrop-blur-sm'>
                            <p className='line-clamp-2 text-[10px] text-white'>
                              {prompt}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className='flex aspect-square h-4/5 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-stone-800'>
                          {jobResultContent ? (
                            <Image
                              src={
                                jobResultContent.startsWith('http')
                                  ? jobResultContent
                                  : `${process.env.NEXT_PUBLIC_API_URL}${jobResultContent}`
                              }
                              alt={prompt}
                              className='h-full w-full object-cover'
                            />
                          ) : (
                            <IconPhoto className='h-12 w-12 text-white/20' />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
