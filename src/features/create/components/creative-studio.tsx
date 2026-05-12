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
  IconLoader2,
  IconAlertCircle,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconDeviceFloppy
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
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
import { useContents } from '../../repurpose/api/contents';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type StudioMode = 'video' | 'image' | 'blog';

export function CreativeStudio() {
  const router = useRouter();
  const [mode, setMode] = React.useState<StudioMode>('video');
  const [result, setResult] = React.useState<string | null>(null);
  const { user } = useAuthStore();
  const { createJobMutation, useGetJob } = useAiJobs();
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const { data: activeJob, isError: jobError } = useGetJob(activeJobId);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const [prompt, setPrompt] = React.useState('');
  const [style, setStyle] = React.useState('cinematic');
  const [ratio, setRatio] = React.useState('9:16');
  const [tone, setTone] = React.useState('professional');

  const { useGetWallet } = useSubscription();
  const { data: wallet } = useGetWallet();
  const balance = wallet?.balance ?? 0;
  const hasEnoughCredits = balance >= 1;

  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              : 'video_generation',
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

  const { createContentMutation, createAssetMutation } = useContents();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSaveToLibrary = async () => {
    if (!activeJob || !user || !jobResultContent) return;

    setIsSaving(true);
    try {
      // 1. Create content
      const content = await createContentMutation.mutateAsync({
        title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
        status: 'completed',
        sourceType:
          mode === 'image'
            ? 'ai_image'
            : mode === 'video'
              ? 'ai_video'
              : 'ai_blog',
        user: { id: user.id }
      } as any);

      // 2. Create asset
      await createAssetMutation.mutateAsync({
        content: { id: content.id },
        type:
          mode === 'image' ? 'image' : mode === 'video' ? 'video' : 'document',
        storageProvider: activeJob.output?.provider || 'local',
        fileUrl: activeJob.output?.fileUrl || jobResultContent,
        mimeType:
          mode === 'image'
            ? 'image/png'
            : mode === 'video'
              ? 'video/mp4'
              : 'text/markdown'
      });

      setIsSaved(true);
      toast.success('Saved to library successfully!');
    } catch (error) {
      toast.error('Failed to save to library. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Monitor job status
  React.useEffect(() => {
    if (activeJob?.status === 'completed') {
      setResult('success');
    } else if (activeJob?.status === 'failed') {
      setActiveJobId(null);
    }
  }, [activeJob?.status]);

  const loading =
    createJobMutation.isPending ||
    (!!activeJobId &&
      !jobError &&
      (!activeJob ||
        ['pending', 'queued', 'processing'].includes(activeJob.status)));

  const showResult = activeJob?.status === 'completed';

  const jobResultContent = React.useMemo(() => {
    if (!activeJob || activeJob.status !== 'completed') return null;

    let content: string = '';
    if (mode === 'image' || mode === 'video') return activeJob.output?.fileUrl;
    if (mode === 'blog') {
      content =
        typeof activeJob.output === 'string'
          ? activeJob.output
          : activeJob.output?.text || JSON.stringify(activeJob.output);
    } else {
      content = JSON.stringify(activeJob.output);
    }

    // Clean up markdown prefix if present
    return content.replace(/^markdown\n?|^markdown\s+/i, '');
  }, [activeJob, mode]);

  return (
    <div className='flex flex-1 flex-col gap-6 lg:overflow-hidden'>
      <Tabs
        defaultValue='video'
        className='w-full'
        onValueChange={(v) => {
          setMode(v as StudioMode);
          setResult(null);
          setActiveJobId(null);
        }}
      >
        <TabsList className='bg-muted/50 flex w-full flex-wrap justify-center gap-2 rounded-2xl p-1.5 sm:inline-flex sm:w-fit sm:flex-nowrap sm:justify-start sm:gap-4 sm:rounded-full'>
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

      <div className='grid flex-1 gap-6 lg:grid-cols-[400px_1fr] lg:overflow-hidden'>
        {/* Parameters Sidebar */}
        <Card className='bg-muted/20 flex flex-col rounded-3xl border-none lg:overflow-hidden'>
          <div className='space-y-6 p-6 lg:flex-1 lg:overflow-y-auto'>
            <div className='space-y-4'>
              <h3 className='text-muted-foreground text-sm font-semibold tracking-wider uppercase'>
                Prompt
              </h3>
              <Textarea
                placeholder={`Describe the ${mode} you want to create...`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className='bg-background scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent h-[150px] resize-none rounded-2xl border-none shadow-sm'
                style={{ fieldSizing: 'fixed' } as any}
              />
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
        <div className='bg-muted/10 border-muted-foreground/10 relative flex min-h-[500px] flex-col overflow-hidden rounded-3xl border-2 border-dashed lg:min-h-0'>
          <AnimatePresence mode='wait'>
            {!loading && !showResult && !jobError && (
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

            {jobError && (
              <motion.div
                key='error'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex flex-1 flex-col items-center justify-center p-12 text-center'
              >
                <div className='bg-destructive/10 mb-6 rounded-full p-8'>
                  <IconAlertCircle className='text-destructive h-16 w-16' />
                </div>
                <h3 className='mb-2 text-2xl font-bold'>
                  Something went wrong
                </h3>
                <p className='text-muted-foreground max-w-md'>
                  Failed to fetch the generation result. Please try again or
                  check your connection.
                </p>
                <Button
                  variant='outline'
                  className='mt-4 rounded-xl'
                  onClick={() => setActiveJobId(activeJobId)}
                >
                  Retry
                </Button>
              </motion.div>
            )}

            {showResult && (
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
                  <div className='flex items-center gap-3'>
                    {(mode === 'blog' || mode === 'video') &&
                      jobResultContent && (
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 rounded-full px-4'
                            onClick={() => {
                              if (mode === 'blog') {
                                copyToClipboard(jobResultContent);
                              } else {
                                const url = jobResultContent.startsWith('http')
                                  ? jobResultContent
                                  : `${API_BASE_URL}/v1${jobResultContent}`;
                                window.open(url, '_blank');
                              }
                            }}
                          >
                            {mode === 'blog' ? (
                              copied ? (
                                <>
                                  <IconCheck className='mr-2 h-3.5 w-3.5' />{' '}
                                  Copied
                                </>
                              ) : (
                                <>
                                  <IconCopy className='mr-2 h-3.5 w-3.5' /> Copy
                                  Post
                                </>
                              )
                            ) : (
                              <>
                                <IconDownload className='mr-2 h-3.5 w-3.5' />{' '}
                                Download
                              </>
                            )}
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={isSaving || isSaved}
                            className='h-8 rounded-full px-4'
                            onClick={handleSaveToLibrary}
                          >
                            {isSaved ? (
                              <>
                                <IconCheck className='mr-2 h-3.5 w-3.5' /> Saved
                              </>
                            ) : (
                              <>
                                <IconDeviceFloppy className='mr-2 h-3.5 w-3.5' />{' '}
                                {isSaving ? 'Saving...' : 'Save to Library'}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    {mode === 'image' && jobResultContent && (
                      <div className='flex items-center gap-2'>
                        <div className='bg-muted/50 flex items-center gap-2 rounded-full border px-3 py-1.5'>
                          <span className='text-muted-foreground max-w-[200px] truncate text-xs font-medium'>
                            {jobResultContent.startsWith('http')
                              ? jobResultContent
                              : `${API_BASE_URL}/v1${jobResultContent}`}
                          </span>
                          <div className='bg-muted-foreground/20 h-3 w-[1px]' />
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 rounded-full'
                            onClick={() =>
                              copyToClipboard(
                                jobResultContent.startsWith('http')
                                  ? jobResultContent
                                  : `${API_BASE_URL}/v1${jobResultContent}`
                              )
                            }
                          >
                            {copied ? (
                              <IconCheck className='text-primary h-3.5 w-3.5' />
                            ) : (
                              <IconCopy className='h-3.5 w-3.5' />
                            )}
                          </Button>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={isSaving || isSaved}
                          className='h-8 rounded-full px-4'
                          onClick={handleSaveToLibrary}
                        >
                          {isSaved ? (
                            <>
                              <IconCheck className='mr-2 h-3.5 w-3.5' /> Saved
                            </>
                          ) : (
                            <>
                              <IconDeviceFloppy className='mr-2 h-3.5 w-3.5' />{' '}
                              {isSaving ? 'Saving...' : 'Save to Library'}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className='bg-background shadow-primary/5 relative flex-1 overflow-hidden rounded-2xl shadow-2xl'>
                  {mode === 'blog' ? (
                    <div className='absolute inset-0 overflow-y-auto bg-stone-50/50 p-8 lg:p-12 dark:bg-stone-950/50'>
                      <div className='prose prose-stone dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary prose-pre:bg-transparent prose-pre:p-0 max-w-none'>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }: any) {
                              const match = /language-(\w+)/.exec(
                                className || ''
                              );
                              return !inline && match ? (
                                <div className='my-6 overflow-hidden rounded-xl border border-white/10 shadow-xl'>
                                  <div className='flex items-center justify-between bg-stone-800 px-4 py-2 text-xs text-stone-400'>
                                    <span>{match[1].toUpperCase()}</span>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='h-6 w-6 hover:bg-white/10'
                                      onClick={() =>
                                        copyToClipboard(
                                          String(children).replace(/\n$/, '')
                                        )
                                      }
                                    >
                                      <IconCopy className='h-3 w-3' />
                                    </Button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag='div'
                                    customStyle={{
                                      margin: 0,
                                      padding: '1.5rem',
                                      fontSize: '0.875rem',
                                      lineHeight: '1.5'
                                    }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code
                                  className='bg-muted/50 rounded-md px-1.5 py-0.5 font-mono text-sm font-medium'
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            img({ node, ...props }: any) {
                              return (
                                <div className='my-8 overflow-hidden rounded-2xl border border-white/10 shadow-2xl'>
                                  <Image
                                    width={500}
                                    height={500}
                                    className='w-full object-cover'
                                    {...props}
                                    alt={props.alt || 'Generated asset'}
                                  />
                                </div>
                              );
                            },
                            table({ children }: any) {
                              return (
                                <div className='my-8 overflow-x-auto rounded-xl border'>
                                  <table className='w-full border-collapse text-left text-sm'>
                                    {children}
                                  </table>
                                </div>
                              );
                            }
                          }}
                        >
                          {jobResultContent || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : mode === 'video' ? (
                    <div className='flex h-full min-h-0 w-full items-center justify-center bg-stone-950 p-4 lg:p-8'>
                      <div
                        className={cn(
                          'group relative overflow-hidden rounded-2xl border border-white/10 bg-stone-900 shadow-2xl',
                          ratio === '9:16'
                            ? 'aspect-[9/16]'
                            : ratio === '16:9'
                              ? 'aspect-[16/9]'
                              : 'aspect-square',
                          'max-h-full max-w-full'
                        )}
                      >
                        {jobResultContent ? (
                          <video
                            src={
                              jobResultContent.startsWith('http')
                                ? jobResultContent
                                : `${API_BASE_URL}/v1${jobResultContent}`
                            }
                            controls
                            className='h-full w-full object-contain'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center'>
                            <IconVideo className='h-12 w-12 text-white/20' />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='flex h-full min-h-0 w-full items-center justify-center bg-stone-950 p-4 lg:p-8'>
                      <div
                        className={cn(
                          'group hover:shadow-primary/20 relative overflow-hidden rounded-2xl border border-white/10 bg-stone-900 shadow-2xl transition-all duration-500 hover:scale-[1.02]',
                          ratio === '9:16'
                            ? 'aspect-[9/16]'
                            : ratio === '16:9'
                              ? 'aspect-[16/9]'
                              : 'aspect-square',
                          'max-h-full max-w-full'
                        )}
                      >
                        {jobResultContent ? (
                          <>
                            <div className='absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                            <Image
                              src={
                                jobResultContent.startsWith('http')
                                  ? jobResultContent
                                  : `${API_BASE_URL}/v1${jobResultContent}`
                              }
                              alt={prompt}
                              fill
                              className='object-contain'
                              priority
                              unoptimized
                            />
                            <div className='absolute right-4 bottom-4 left-4 z-20 flex translate-y-4 items-center justify-between opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100'>
                              <Button
                                size='sm'
                                variant='secondary'
                                className='bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20'
                                onClick={() => {
                                  const url = jobResultContent.startsWith(
                                    'http'
                                  )
                                    ? jobResultContent
                                    : `${API_BASE_URL}/v1${jobResultContent}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <IconExternalLink className='mr-2 h-4 w-4' />
                                Full Image
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className='flex h-full w-full items-center justify-center'>
                            <IconPhoto className='h-12 w-12 text-white/20' />
                          </div>
                        )}
                      </div>
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
