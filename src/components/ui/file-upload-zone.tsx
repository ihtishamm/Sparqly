'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FileUploadZoneProps = {
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  progress?: number | null;
  onCancel?: () => void;
  className?: string;
  accept?: string;
};

export function FileUploadZone({
  onFileSelect,
  onUrlSubmit,
  progress = null,
  onCancel,
  className,
  accept
}: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [url, setUrl] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
    e.target.value = '';
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed && onUrlSubmit) onUrlSubmit(trimmed);
  };

  const showProgress = progress !== null && progress !== undefined;

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-border bg-muted/30 hover:border-muted-foreground/30 hover:bg-muted/50 focus-visible:ring-ring flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          isDragActive && 'upload-zone-drag border-ring bg-muted/50'
        )}
      >
        <input
          ref={inputRef}
          type='file'
          accept={accept}
          onChange={handleFileInputChange}
          className='hidden'
          aria-hidden
        />
        <p className='text-muted-foreground text-center text-sm'>
          Drag and drop your file here, or click to browse
        </p>
      </div>

      <div className='flex items-center gap-4'>
        <span className='text-muted-foreground shrink-0 text-sm'>OR</span>
        <div className='bg-border h-px flex-1' />
      </div>

      <form onSubmit={handleUrlSubmit} className='flex gap-2'>
        <Input
          type='url'
          placeholder='Paste video or audio URL'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className='flex-1 rounded-xl'
        />
        <Button type='submit' variant='secondary' className='rounded-xl'>
          Add URL
        </Button>
      </form>

      {showProgress && (
        <div className='space-y-2'>
          <Progress value={progress} className='h-2 rounded-full' />
          <div className='flex justify-end'>
            {onCancel && (
              <Button variant='ghost' size='sm' onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
