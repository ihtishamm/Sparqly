'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconUpload,
  IconLink,
  IconSparkles,
  IconCheck,
  IconLoader2,
  IconArrowRight,
  IconVideo,
  IconFileText,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconCircleCheck,
  IconWand
} from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { BlogPreview } from './blog-preview';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  VerticalStepper,
  type StepperStep
} from '@/components/ui/vertical-stepper';
import { useAiJobs } from '../api/ai-jobs';
import { useContents } from '../api/contents';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

import { useSubscription } from '@/features/subscription/api/subscription';
import { useRouter } from 'next/navigation';

type FlowStage = 'source' | 'config' | 'processing' | 'result';

const REPURPOSE_TYPES = [
  {
    id: 'short-clips',
    title: 'Short Clips',
    icon: IconVideo,
    description: 'Viral-ready vertical video scripts'
  },
  {
    id: 'blog-post',
    title: 'Blog Post',
    icon: IconFileText,
    description: 'SEO optimized long-form article'
  },
  {
    id: 'linkedin',
    title: 'LinkedIn Post',
    icon: IconBrandLinkedin,
    description: 'Professional thought leadership post'
  },
  {
    id: 'threads',
    title: 'Threads/Twitter',
    icon: IconBrandTwitter,
    description: 'Engaging social media thread'
  }
];

const PROCESSING_STEPS: StepperStep[] = [
  {
    id: 'upload',
    icon: IconUpload,
    title: 'Uploading',
    description: 'Your file is being uploaded to our servers.'
  },
  {
    id: 'transcribe',
    icon: IconFileText,
    title: 'Transcribing',
    description: 'Converting speech to text.'
  },
  {
    id: 'moments',
    icon: IconSparkles,
    title: 'Detecting Key Moments',
    description: 'Identifying highlights and segments.'
  },
  {
    id: 'generate',
    icon: IconCircleCheck,
    title: 'Generating Content',
    description: 'Finalizing your repurposed content.'
  }
];

export function RepurposeFlow() {
  const [stage, setStage] = React.useState<FlowStage>('source');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([
    'short-clips'
  ]);
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);

  const { user } = useAuthStore();
  const { createContentMutation } = useContents();
  const { createJobMutation, useGetJob } = useAiJobs();
  const { data: activeJob } = useGetJob(activeJobId);
  const { useGetWallet } = useSubscription();
  const { data: wallet } = useGetWallet();
  const router = useRouter();

  const balance = wallet?.balance ?? 0;
  const hasEnoughCredits = balance >= 1;

  // Monitor job status
  React.useEffect(() => {
    if (activeJob?.status === 'completed') {
      setStage('result');
      toast.success('AI Job completed successfully!');
    } else if (activeJob?.status === 'failed') {
      toast.error('AI Job failed: ' + activeJob.errorMessage);
      setStage('source');
      setActiveJobId(null);
    }
  }, [activeJob?.status, activeJob?.errorMessage]);

  const handleStartRepurpose = async () => {
    if (!user || !hasEnoughCredits) return;

    try {
      setStage('processing');

      // 1. Create content entry
      const content = await createContentMutation.mutateAsync({
        title: sourceUrl || 'Uploaded Content',
        sourceUrl: sourceUrl || undefined,
        type: 'video'
      });

      // 2. Start AI Job
      const job = await createJobMutation.mutateAsync({
        jobType: 'repurpose',
        input: {
          contentId: content.id,
          targetTypes: selectedTypes,
          tone: 'engaging'
        },
        user: { id: user.id },
        status: 'pending'
      });

      setActiveJobId(job.id);
    } catch (error) {
      setStage('source');
    }
  };

  const renderStage = () => {
    switch (stage) {
      case 'source':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='space-y-6'
          >
            <div className='grid gap-6 md:grid-cols-2'>
              <Card className='border-primary/20 bg-primary/5 hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg'>
                <CardHeader>
                  <IconLink className='text-primary mb-2 h-10 w-10' />
                  <CardTitle>Link a Video</CardTitle>
                  <CardDescription>
                    Paste a YouTube, Vimeo or social link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder='https://youtube.com/watch?v=...'
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className='rounded-xl'
                  />
                </CardContent>
              </Card>

              <Card className='hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg'>
                <CardHeader>
                  <IconUpload className='text-muted-foreground mb-2 h-10 w-10' />
                  <CardTitle>Upload File</CardTitle>
                  <CardDescription>
                    MP4, MOV or MP3 files up to 2GB
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='bg-muted/50 border-muted-foreground/20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-6'>
                    <p className='text-muted-foreground text-sm'>
                      Coming soon...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='flex justify-end'>
              <Button
                disabled={!sourceUrl}
                onClick={() => setStage('config')}
                className='rounded-full px-8'
              >
                Continue <IconArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </motion.div>
        );

      case 'config':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className='space-y-8'
          >
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold'>
                What should we generate?
              </h3>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {REPURPOSE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedTypes.includes(type.id);
                  return (
                    <div
                      key={type.id}
                      onClick={() => {
                        setSelectedTypes((prev) =>
                          isSelected
                            ? prev.filter((t) => t !== type.id)
                            : [...prev, type.id]
                        );
                      }}
                      className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <Icon
                        className={`mb-3 h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <h4 className='font-medium'>{type.title}</h4>
                      <p className='text-muted-foreground text-xs'>
                        {type.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              {!hasEnoughCredits && (
                <div className='bg-destructive/10 border-destructive/20 flex items-center justify-between rounded-2xl border p-4'>
                  <div className='space-y-1'>
                    <p className='text-destructive text-sm font-bold tracking-widest uppercase'>
                      Insufficient Credits
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      You need at least 1 credit to start a repurposing job.
                    </p>
                  </div>
                  <Button
                    variant='default'
                    size='sm'
                    className='rounded-xl'
                    onClick={() => router.push('/dashboard/subscription')}
                  >
                    Upgrade Plan
                  </Button>
                </div>
              )}
              <div className='flex items-center justify-between'>
                <Button variant='ghost' onClick={() => setStage('source')}>
                  Back
                </Button>
                <Button
                  onClick={handleStartRepurpose}
                  className='rounded-full px-8'
                  disabled={selectedTypes.length === 0 || !hasEnoughCredits}
                >
                  Start Repurposing <IconSparkles className='ml-2 h-4 w-4' />
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 'processing':
        const statusMap: Record<string, number> = {
          queued: 0,
          processing: 1,
          completed: 3,
          failed: -1
        };
        const currentStep = statusMap[activeJob?.status || 'queued'];

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex flex-col items-center justify-center space-y-8 py-12'
          >
            <div className='relative flex h-32 w-32 items-center justify-center'>
              <IconLoader2 className='text-primary h-24 w-24 animate-spin' />
              <div className='absolute inset-0 flex items-center justify-center'>
                <IconSparkles className='text-primary h-8 w-8 animate-pulse' />
              </div>
            </div>

            <div className='w-full max-w-md space-y-6'>
              <div className='space-y-2 text-center'>
                <h3 className='text-2xl font-bold'>Processing your content</h3>
                <p className='text-muted-foreground'>
                  This usually takes 2-5 minutes depending on the length.
                </p>
              </div>

              <VerticalStepper
                steps={PROCESSING_STEPS}
                activeIndex={currentStep}
                loading={true}
              />
            </div>
          </motion.div>
        );

      case 'result':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-8'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-full p-2.5'>
                  <IconCircleCheck className='text-primary h-7 w-7' />
                </div>
                <div>
                  <h3 className='text-3xl font-bold'>Repurposing Complete</h3>
                  <p className='text-muted-foreground text-sm'>
                    AI has generated {selectedTypes.length} content variations
                    for you.
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <Button
                  onClick={() => setStage('source')}
                  variant='outline'
                  className='rounded-full'
                >
                  New Project
                </Button>
                <Link href='/dashboard/editor/new'>
                  <Button className='shadow-primary/20 rounded-full bg-purple-600 px-6 shadow-lg hover:bg-purple-700'>
                    <IconWand className='mr-2 h-4 w-4' /> Advanced Editor
                  </Button>
                </Link>
                <Button className='shadow-primary/20 rounded-full px-6 shadow-lg'>
                  Save All Results
                </Button>
              </div>
            </div>

            <div className='grid gap-8 lg:grid-cols-[1fr_300px]'>
              <div className='space-y-6'>
                <Tabs defaultValue={selectedTypes[0]} className='w-full'>
                  <TabsList className='bg-muted/50 mb-6 inline-flex gap-2 rounded-2xl p-1'>
                    {selectedTypes.map((typeId) => (
                      <TabsTrigger
                        key={typeId}
                        value={typeId}
                        className='data-[state=active]:bg-background rounded-xl px-6 data-[state=active]:shadow-sm'
                      >
                        {REPURPOSE_TYPES.find((t) => t.id === typeId)?.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {selectedTypes.map((typeId) => (
                    <TabsContent
                      key={typeId}
                      value={typeId}
                      className='space-y-6 focus-visible:outline-none'
                    >
                      {typeId === 'blog-post' ? (
                        <div className='grid gap-6'>
                          <BlogPreview
                            content={
                              activeJob?.output?.[typeId] ||
                              '<h1>No content generated yet</h1>'
                            }
                          />
                          <Card className='bg-muted/20 border-none'>
                            <CardHeader className='pb-3'>
                              <CardTitle className='text-muted-foreground text-sm font-semibold tracking-wider uppercase'>
                                Quick Edit
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <RichTextEditor
                                value={activeJob?.output?.[typeId] || ''}
                                onChange={() => {}}
                                minHeight='200px'
                              />
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Card className='bg-muted/20 overflow-hidden border-none'>
                          <div className='bg-primary/5 border-b px-6 py-4'>
                            <h4 className='font-semibold'>
                              Generated{' '}
                              {
                                REPURPOSE_TYPES.find((t) => t.id === typeId)
                                  ?.title
                              }
                            </h4>
                          </div>
                          <CardContent className='pt-6'>
                            <RichTextEditor
                              value={
                                activeJob?.output?.[typeId] ||
                                `<p>Your generated ${typeId} will appear here.</p>`
                              }
                              onChange={() => {}}
                              placeholder={`Your ${typeId} content...`}
                              minHeight='400px'
                            />
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <aside className='space-y-6'>
                <Card className='border-primary/10 rounded-2xl'>
                  <CardHeader>
                    <CardTitle className='text-lg'>AI Assistant</CardTitle>
                    <CardDescription>
                      Refine your results with one click
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='grid gap-2'>
                    <Button
                      variant='outline'
                      className='justify-start rounded-xl'
                      size='sm'
                    >
                      <IconSparkles className='mr-2 h-4 w-4 text-yellow-500' />{' '}
                      Make it shorter
                    </Button>
                    <Button
                      variant='outline'
                      className='justify-start rounded-xl'
                      size='sm'
                    >
                      <IconSparkles className='mr-2 h-4 w-4 text-blue-500' />{' '}
                      Add more emojis
                    </Button>
                    <Button
                      variant='outline'
                      className='justify-start rounded-xl'
                      size='sm'
                    >
                      <IconSparkles className='mr-2 h-4 w-4 text-green-500' />{' '}
                      Professional tone
                    </Button>
                    <Button
                      variant='outline'
                      className='justify-start rounded-xl'
                      size='sm'
                    >
                      <IconSparkles className='mr-2 h-4 w-4 text-purple-500' />{' '}
                      Change to listicle
                    </Button>
                  </CardContent>
                </Card>

                <Card className='bg-primary text-primary-foreground rounded-2xl'>
                  <CardHeader>
                    <CardTitle className='text-lg'>Publish Now</CardTitle>
                    <CardDescription className='text-primary-foreground/70'>
                      Directly post to your socials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='grid gap-2'>
                    <Button variant='secondary' className='w-full rounded-xl'>
                      <IconBrandLinkedin className='mr-2 h-4 w-4' /> Post to
                      LinkedIn
                    </Button>
                    <Button variant='secondary' className='w-full rounded-xl'>
                      <IconBrandTwitter className='mr-2 h-4 w-4' /> Share on
                      Twitter
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className='mx-auto max-w-5xl py-4'>
      <AnimatePresence mode='wait'>{renderStage()}</AnimatePresence>
    </div>
  );
}
