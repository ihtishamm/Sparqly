'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import {
  VerticalStepper,
  type StepperStep
} from '@/components/ui/vertical-stepper';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  IconUpload,
  IconFileText,
  IconSparkles,
  IconFile
} from '@tabler/icons-react';

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
    icon: IconFile,
    title: 'Generating Content',
    description: 'Creating clips, blog post, and captions.'
  }
];

export default function RepurposeViewPage() {
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(
    null
  );
  const [processingStep, setProcessingStep] = React.useState(-1);
  const [processing, setProcessing] = React.useState(false);
  const [shortClips, setShortClips] = React.useState('');
  const [blog, setBlog] = React.useState('');
  const [captions, setCaptions] = React.useState('');
  const [version, setVersion] = React.useState(1);

  const handleFileSelect = React.useCallback(() => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(interval);
          setProcessingStep(0);
          setProcessing(true);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  }, []);

  const handleUrlSubmit = React.useCallback((_url: string) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(interval);
          setProcessingStep(0);
          setProcessing(true);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  }, []);

  const handleCancel = React.useCallback(() => {
    setUploadProgress(null);
    setProcessingStep(-1);
    setProcessing(false);
  }, []);

  React.useEffect(() => {
    if (!processing || processingStep < 0) return;
    if (processingStep >= PROCESSING_STEPS.length - 1) {
      const t = setTimeout(() => {
        setProcessing(false);
        setShortClips('<p>Short clip scripts will appear here.</p>');
        setBlog('<p>Blog post content will appear here.</p>');
        setCaptions('<p>Caption variations will appear here.</p>');
      }, 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProcessingStep((s) => s + 1), 600);
    return () => clearTimeout(t);
  }, [processing, processingStep]);

  const handleRegenerate = () => {
    setVersion((v) => v + 1);
  };

  const handleSave = () => {
    // No-op for frontend-only
  };

  const wordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    return text ? text.split(/\s+/).length : 0;
  };

  const showOutput =
    !processing &&
    processingStep >= PROCESSING_STEPS.length - 1 &&
    (shortClips || blog || captions);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-6'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Repurpose Content
          </h1>
          <p className='text-muted-foreground'>
            Upload a video or paste a URL to turn it into short clips, blog
            posts, and captions.
          </p>
        </header>

        <section className='space-y-4'>
          <h2 className='text-lg font-semibold'>Upload</h2>
          <FileUploadZone
            onFileSelect={handleFileSelect}
            onUrlSubmit={handleUrlSubmit}
            progress={uploadProgress}
            onCancel={handleCancel}
          />
        </section>

        {(processing || processingStep >= 0) && (
          <section className='space-y-4'>
            <h2 className='text-lg font-semibold'>Processing</h2>
            <VerticalStepper
              steps={PROCESSING_STEPS}
              activeIndex={processingStep >= 0 ? processingStep : 0}
              loading={processing}
            />
          </section>
        )}

        {showOutput && (
          <section className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>Output</h2>
              <Badge variant='secondary'>v{version}</Badge>
            </div>
            <Tabs defaultValue='clips' className='w-full'>
              <TabsList className='rounded-xl'>
                <TabsTrigger value='clips' className='rounded-lg'>
                  Short Clips
                </TabsTrigger>
                <TabsTrigger value='blog' className='rounded-lg'>
                  Blog
                </TabsTrigger>
                <TabsTrigger value='captions' className='rounded-lg'>
                  Captions
                </TabsTrigger>
              </TabsList>
              <TabsContent value='clips' className='mt-4 space-y-4'>
                <RichTextEditor
                  value={shortClips}
                  onChange={setShortClips}
                  placeholder='Short clip scripts...'
                />
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-muted-foreground text-sm'>
                    {wordCount(shortClips)} words
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleRegenerate}
                    >
                      Regenerate
                    </Button>
                    <Button size='sm' onClick={handleSave}>
                      Save
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='blog' className='mt-4 space-y-4'>
                <RichTextEditor
                  value={blog}
                  onChange={setBlog}
                  placeholder='Blog post content...'
                />
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-muted-foreground text-sm'>
                    {wordCount(blog)} words
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleRegenerate}
                    >
                      Regenerate
                    </Button>
                    <Button size='sm' onClick={handleSave}>
                      Save
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='captions' className='mt-4 space-y-4'>
                <RichTextEditor
                  value={captions}
                  onChange={setCaptions}
                  placeholder='Caption variations...'
                />
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-muted-foreground text-sm'>
                    {wordCount(captions)} words
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleRegenerate}
                    >
                      Regenerate
                    </Button>
                    <Button size='sm' onClick={handleSave}>
                      Save
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
