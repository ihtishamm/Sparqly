'use client';

import { MousePointerClick, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { duration, timecode } from '@/lib/format';
import { MIN_ELEMENT_MS, type El } from './model';

type Props = {
  el: El | null;
  isMain: boolean;
  width: number;
  height: number;
  /** Records a history step, unlike `onPreview`. */
  onChange: (patch: (el: El) => El) => void;
  onBegin: () => void;
  onPreview: (patch: (el: El) => El) => void;
  onEnd: () => void;
  onDelete: () => void;
};

function Field({
  label,
  children,
  htmlFor
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className='space-y-1.5'>
      <Label
        htmlFor={htmlFor}
        className='text-muted-foreground text-xs font-normal'
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onCommit
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  onCommit: (value: number) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <div className='relative'>
        <Input
          id={id}
          key={value}
          type='number'
          inputMode='decimal'
          defaultValue={value}
          min={min}
          max={max}
          className='tnum pr-8'
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n !== value) {
              onCommit(
                Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
              );
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {suffix && (
          <span className='text-subtle-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs'>
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onBegin,
  onPreview,
  onEnd
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onBegin: () => void;
  onPreview: (v: number) => void;
  onEnd: () => void;
}) {
  return (
    <Field label={`${label} · ${format(value)}`}>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onPointerDown={onBegin}
        onValueChange={([v]) => onPreview(v)}
        onValueCommit={onEnd}
      />
    </Field>
  );
}

export function Inspector(props: Props) {
  const { el, isMain } = props;

  if (!el) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-[13px]'>
        <MousePointerClick className='size-5' aria-hidden />
        Select something on the timeline or in the preview to edit it.
      </div>
    );
  }

  const setProps = (patch: Record<string, any>) =>
    props.onChange((x) => ({
      ...x,
      properties: { ...x.properties, ...patch }
    }));
  const previewProps = (patch: Record<string, any>) =>
    props.onPreview((x) => ({
      ...x,
      properties: { ...x.properties, ...patch }
    }));

  const title =
    el.type === 'text'
      ? 'Text'
      : el.type === 'image'
        ? 'Image'
        : el.type === 'audio'
          ? 'Audio'
          : isMain
            ? 'Clip'
            : 'Video';

  return (
    <div className='space-y-5 p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='font-medium'>{title}</p>
          <p className='text-muted-foreground tnum text-xs'>
            {timecode(el.startTimeMs)} – {timecode(el.endTimeMs)} ·{' '}
            {duration(el.endTimeMs - el.startTimeMs)}
          </p>
        </div>
        {!isMain && (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Delete'
            onClick={props.onDelete}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      {el.type === 'text' && (
        <>
          <Field label='Text' htmlFor='el-text'>
            <Textarea
              id='el-text'
              key={el.key}
              rows={3}
              maxLength={500}
              defaultValue={el.properties.text ?? ''}
              onBlur={(e) => {
                const text = e.target.value.replace(/\s*\n\s*/g, ' ');
                if (text === el.properties.text) return;
                // Edited text replaces the word-by-word karaoke timing.
                props.onChange((x) => {
                  const properties: Record<string, any> = {
                    ...x.properties,
                    text
                  };
                  delete properties.words;
                  return { ...x, properties };
                });
              }}
            />
          </Field>
          {Array.isArray(el.properties.words) && (
            <p className='text-subtle-foreground -mt-3 text-xs'>
              Editing the text turns off word-by-word highlighting for this
              line.
            </p>
          )}
          <SliderField
            label='Size'
            value={Number(el.properties.fontSize) || 80}
            min={24}
            max={200}
            step={2}
            format={(v) => `${v}px`}
            onBegin={props.onBegin}
            onPreview={(v) => previewProps({ fontSize: v })}
            onEnd={props.onEnd}
          />
          <Field label='Colour' htmlFor='el-colour'>
            <div className='flex items-center gap-2'>
              <input
                id='el-colour'
                type='color'
                value={el.properties.fontColor || '#ffffff'}
                onChange={(e) => setProps({ fontColor: e.target.value })}
                className='h-8 w-10 cursor-pointer rounded-md border bg-transparent p-1'
              />
              <span className='text-muted-foreground font-mono text-xs uppercase'>
                {el.properties.fontColor || '#ffffff'}
              </span>
            </div>
          </Field>
        </>
      )}

      {(el.type === 'text' || el.type === 'image') && (
        <div className='space-y-2'>
          <div className='grid grid-cols-2 gap-2'>
            <NumberField
              id='el-x'
              label='X'
              suffix='px'
              min={0}
              max={props.width}
              value={Math.round(
                el.properties.position?.x ??
                  (el.type === 'text' ? props.width / 2 : 0)
              )}
              onCommit={(x) =>
                setProps({
                  position: {
                    x,
                    y: el.properties.position?.y ?? props.height - 200
                  }
                })
              }
            />
            <NumberField
              id='el-y'
              label='Y'
              suffix='px'
              min={0}
              max={props.height}
              value={Math.round(
                el.properties.position?.y ??
                  (el.type === 'text' ? props.height - 200 : 0)
              )}
              onCommit={(y) =>
                setProps({
                  position: {
                    x: el.properties.position?.x ?? props.width / 2,
                    y
                  }
                })
              }
            />
          </div>
          {el.type === 'text' && el.properties.position && (
            <Button
              variant='link'
              size='xs'
              className='h-auto p-0'
              onClick={() => setProps({ position: undefined })}
            >
              Reset to caption position
            </Button>
          )}
        </div>
      )}

      {el.type === 'image' && (
        <SliderField
          label='Width'
          value={
            el.properties.scale?.x > 0 ? el.properties.scale.x : props.width
          }
          min={40}
          max={props.width}
          step={10}
          format={(v) => `${Math.round((v / props.width) * 100)}%`}
          onBegin={props.onBegin}
          onPreview={(v) =>
            previewProps({ scale: { x: Math.round(v), y: -1 } })
          }
          onEnd={props.onEnd}
        />
      )}

      {el.type === 'audio' && (
        <SliderField
          label='Volume'
          value={el.properties.volume ?? 1}
          min={0}
          max={2}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onBegin={props.onBegin}
          onPreview={(v) => previewProps({ volume: v })}
          onEnd={props.onEnd}
        />
      )}

      {isMain ? (
        <p className='text-muted-foreground bg-secondary rounded-lg px-3 py-2 text-xs'>
          Drag the clip’s edges to trim it. Captions move with the audio when
          you trim the start. Source{' '}
          {timecode(el.properties.sourceStartMs ?? 0)} –{' '}
          {timecode(el.properties.sourceEndMs ?? el.endTimeMs)}.
        </p>
      ) : (
        <div className='grid grid-cols-2 gap-2'>
          <NumberField
            id='el-start'
            label='Start'
            suffix='s'
            min={0}
            value={Number((el.startTimeMs / 1000).toFixed(2))}
            onCommit={(s) =>
              props.onChange((x) => {
                const start = Math.min(
                  Math.round(s * 1000),
                  x.endTimeMs - MIN_ELEMENT_MS
                );
                return { ...x, startTimeMs: Math.max(0, start) };
              })
            }
          />
          <NumberField
            id='el-end'
            label='End'
            suffix='s'
            min={0}
            value={Number((el.endTimeMs / 1000).toFixed(2))}
            onCommit={(s) =>
              props.onChange((x) => ({
                ...x,
                endTimeMs: Math.max(
                  Math.round(s * 1000),
                  x.startTimeMs + MIN_ELEMENT_MS
                )
              }))
            }
          />
        </div>
      )}
    </div>
  );
}
