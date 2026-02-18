'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Skeleton } from '@/components/ui/skeleton';

const CONTENT_TYPES = [
  { value: 'blog', label: 'Blog' },
  { value: 'script', label: 'Script' },
  { value: 'reel', label: 'Reel Script' }
];

const SUGGESTION_CHIPS = [
  'Top 5 tips for...',
  'How to get started with...',
  'A day in the life of...',
  'Behind the scenes...',
  'Step-by-step guide to...'
];

export default function CreateViewPage() {
  const [promptType, setPromptType] = React.useState<'trending' | 'custom'>(
    'custom'
  );
  const [contentType, setContentType] = React.useState('blog');
  const [prompt, setPrompt] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      setOutput('<p>Generated content will appear here. Edit as needed.</p>');
      setLoading(false);
    }, 1500);
  };

  const addChip = (chip: string) => {
    setPrompt((p) => (p ? `${p} ${chip}` : chip));
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex h-full flex-1 flex-col gap-4'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Create New Content
          </h1>
          <p className='text-muted-foreground'>
            Use trending prompts or write your own to generate blog posts,
            scripts, and more.
          </p>
        </header>

        <ResizablePanelGroup
          direction='horizontal'
          className='border-border min-h-0 flex-1 rounded-2xl border'
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className='flex h-full flex-col gap-4 p-4'>
              <div className='space-y-2'>
                <span className='text-sm font-medium'>Prompt type</span>
                <ToggleGroup
                  type='single'
                  value={promptType}
                  onValueChange={(v) =>
                    v && setPromptType(v as 'trending' | 'custom')
                  }
                  variant='outline'
                  className='w-fit'
                >
                  <ToggleGroupItem
                    value='trending'
                    className='px-4'
                    aria-label='Trending'
                  >
                    Trending
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value='custom'
                    className='px-4'
                    aria-label='Custom'
                  >
                    Custom Prompt
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className='space-y-2'>
                <span className='text-sm font-medium'>Content type</span>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className='w-full rounded-xl'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex flex-1 flex-col gap-2'>
                <span className='text-sm font-medium'>Prompt</span>
                <Textarea
                  placeholder='Describe what you want to create...'
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className='min-h-[120px] flex-1 resize-none rounded-xl'
                />
              </div>

              <div className='space-y-2'>
                <span className='text-sm font-medium'>Suggestions</span>
                <div className='flex flex-wrap gap-2'>
                  {SUGGESTION_CHIPS.map((chip) => (
                    <Button
                      key={chip}
                      variant='secondary'
                      size='sm'
                      className='rounded-lg'
                      onClick={() => addChip(chip)}
                    >
                      {chip}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className='w-full rounded-xl'
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className='flex h-full flex-col gap-4 p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Output</span>
                {output && (
                  <Button size='sm' className='rounded-lg'>
                    Save
                  </Button>
                )}
              </div>
              <div className='min-h-0 flex-1'>
                {loading && (
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-5/6' />
                    <Skeleton className='h-4 w-4/5' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-3/4' />
                  </div>
                )}
                {!loading && output && (
                  <RichTextEditor
                    value={output}
                    onChange={setOutput}
                    placeholder='Generated content...'
                    minHeight='100%'
                    className='h-full'
                  />
                )}
                {!loading && !output && (
                  <div className='text-muted-foreground border-border bg-muted/20 flex h-full items-center justify-center rounded-2xl border border-dashed text-sm'>
                    Click Generate to create content
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </PageContainer>
  );
}
