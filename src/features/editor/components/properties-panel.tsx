'use client';

import * as React from 'react';
import { useEditorStore } from '../store/editor-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { IconTrash } from '@tabler/icons-react';

export function PropertiesPanel() {
  const { selectedElementId, tracks, updateElement, removeElement } =
    useEditorStore();

  const selectedElement = React.useMemo(() => {
    if (!selectedElementId) return null;
    for (const track of tracks) {
      const el = track.elements.find((e) => e.id === selectedElementId);
      if (el) return el;
    }
    return null;
  }, [selectedElementId, tracks]);

  if (!selectedElement) {
    return (
      <div className='bg-muted/10 text-muted-foreground flex w-[300px] items-center justify-center border-l p-6 text-center text-sm italic'>
        Select an element on the timeline to edit its properties
      </div>
    );
  }

  return (
    <div className='bg-background flex w-[300px] flex-col border-l'>
      <div className='bg-muted/20 flex items-center justify-between border-b p-4'>
        <h3 className='text-muted-foreground text-xs font-bold tracking-widest uppercase'>
          Properties
        </h3>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => removeElement(selectedElement.id)}
          className='text-destructive h-8 w-8'
        >
          <IconTrash className='h-4 w-4' />
        </Button>
      </div>

      <div className='space-y-6 overflow-auto p-6'>
        {/* Timing Section */}
        <div className='space-y-4'>
          <h4 className='text-muted-foreground text-xs font-semibold uppercase'>
            Timing
          </h4>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-[10px] uppercase'>Start (ms)</Label>
              <Input
                type='number'
                value={selectedElement.startTimeMs}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    startTimeMs: parseInt(e.target.value)
                  })
                }
                className='h-8 rounded-lg text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-[10px] uppercase'>End (ms)</Label>
              <Input
                type='number'
                value={selectedElement.endTimeMs}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    endTimeMs: parseInt(e.target.value)
                  })
                }
                className='h-8 rounded-lg text-xs'
              />
            </div>
          </div>
        </div>

        {/* Text Properties Section */}
        {selectedElement.type === 'text' && (
          <div className='space-y-4'>
            <h4 className='text-muted-foreground text-xs font-semibold uppercase'>
              Text Styling
            </h4>
            <div className='space-y-2'>
              <Label className='text-[10px] uppercase'>Content</Label>
              <Input
                value={selectedElement.properties.text}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    properties: {
                      ...selectedElement.properties,
                      text: e.target.value
                    }
                  })
                }
                className='h-8 rounded-lg text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-[10px] uppercase'>Font Size</Label>
              <Slider
                value={[selectedElement.properties.fontSize || 40]}
                min={10}
                max={200}
                onValueChange={([val]) =>
                  updateElement(selectedElement.id, {
                    properties: { ...selectedElement.properties, fontSize: val }
                  })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-[10px] uppercase'>Position Y (%)</Label>
              <Slider
                value={[selectedElement.properties.position?.y || 50]}
                min={0}
                max={100}
                onValueChange={([val]) =>
                  updateElement(selectedElement.id, {
                    properties: {
                      ...selectedElement.properties,
                      position: {
                        ...selectedElement.properties.position,
                        y: val
                      }
                    }
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
