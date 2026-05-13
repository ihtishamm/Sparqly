'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  IconPlayerPlay,
  IconCheck,
  IconExternalLink,
  IconVideo,
  IconClock
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useContents } from '../api/contents';

interface Clip {
  id: string;
  type: string;
  title: string;
  status: string;
  fileUrl: string;
  createdAt: string;
}

interface ClipsPreviewProps {
  clips: Clip[];
  contentId?: string;
  className?: string;
}

export function ClipsPreview({
  clips,
  contentId,
  className
}: ClipsPreviewProps) {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const { createAssetMutation } = useContents();

  const handleSaveClip = async (clip: Clip) => {
    if (!contentId) {
      toast.error('Source content ID not found. Cannot save clip.');
      return;
    }

    try {
      await createAssetMutation.mutateAsync({
        content: { id: contentId },
        type: 'video_clip',
        storageProvider: 's3', // Assuming S3 based on the fileUrl in user request
        fileUrl: clip.fileUrl,
        mimeType: 'video/mp4',
        metadata: {
          clipId: clip.id,
          title: clip.title,
          originalCreatedAt: clip.createdAt
        }
      });
      toast.success('Clip saved to your content library!');
    } catch (error) {
      // Error handled by mutation meta
    }
  };

  if (!clips || clips.length === 0) {
    return (
      <div className='bg-muted/5 flex h-60 flex-col items-center justify-center rounded-2xl border-2 border-dashed'>
        <IconVideo className='text-muted-foreground/20 mb-4 h-12 w-12' />
        <p className='text-muted-foreground'>
          No clips found in this job output.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6 sm:grid-cols-2', className)}>
      {clips.map((clip, index) => (
        <motion.div
          key={clip.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className='group border-primary/10 hover:border-primary/30 overflow-hidden transition-all hover:shadow-2xl'>
            <div className='relative aspect-[9/16] max-h-[500px] overflow-hidden bg-black md:aspect-video md:max-h-none'>
              <video
                id={`video-${clip.id}`}
                src={clip.fileUrl}
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                controls={playingId === clip.id}
                onPlay={() => setPlayingId(clip.id)}
                onPause={() => setPlayingId(null)}
                poster={`${clip.fileUrl}#t=0.1`}
              />

              {playingId !== clip.id && (
                <div
                  className='absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 transition-colors hover:bg-black/20'
                  onClick={() => {
                    const video = document.getElementById(
                      `video-${clip.id}`
                    ) as HTMLVideoElement;
                    if (video) video.play();
                  }}
                >
                  <div className='bg-primary/90 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110'>
                    <IconPlayerPlay className='h-8 w-8 fill-current text-white' />
                  </div>
                </div>
              )}

              <div className='absolute top-4 left-4'>
                <Badge className='border-white/20 bg-black/60 font-medium backdrop-blur-md'>
                  Clip {index + 1}
                </Badge>
              </div>
            </div>

            <CardHeader className='p-5 pb-2'>
              <div className='flex items-start justify-between gap-2'>
                <CardTitle className='line-clamp-2 text-lg leading-tight font-bold'>
                  {clip.title}
                </CardTitle>
                <Badge
                  variant='secondary'
                  className='bg-primary/10 text-primary border-none text-[10px] tracking-wider uppercase'
                >
                  {clip.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className='p-5 pt-0'>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <IconClock className='h-3 w-3' />
                <span>
                  {new Date(clip.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className='mx-1'>•</span>
                <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>

            <CardFooter className='flex items-center gap-2 p-5 pt-0'>
              <Button
                variant='outline'
                className='border-primary/20 bg-background hover:bg-primary/5 hover:text-primary h-11 flex-1 rounded-full transition-all'
                onClick={() => {
                  window.open(clip.fileUrl, '_blank');
                }}
              >
                <IconExternalLink className='mr-2 h-4 w-4' /> Expand
              </Button>
              <Button
                className='bg-primary shadow-primary/20 h-11 flex-1 rounded-full shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]'
                onClick={() => handleSaveClip(clip)}
                disabled={createAssetMutation.isPending}
              >
                {createAssetMutation.isPending ? (
                  <span className='flex items-center'>
                    <IconCheck className='mr-2 h-4 w-4 animate-pulse' />{' '}
                    Saving...
                  </span>
                ) : (
                  <>
                    <IconCheck className='mr-2 h-4 w-4' /> Save Clip
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
