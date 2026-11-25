import { describe, expect, it } from 'vitest';
import { audioElements, audioPosition } from './audio-layer';
import type { El } from './model';

const music: El = {
  key: 'm',
  type: 'audio',
  startTimeMs: 2000,
  endTimeMs: 6000,
  layer: 0,
  properties: { sourceStartMs: 1500 },
  assetId: 'a'
};

describe('audioPosition', () => {
  it('maps timeline time into the source', () => {
    expect(audioPosition(music, 2000)).toBe(1.5);
    expect(audioPosition(music, 5000)).toBe(4.5);
  });

  it('is silent outside the element', () => {
    expect(audioPosition(music, 1999)).toBeNull();
    expect(audioPosition(music, 6000)).toBeNull();
  });
});

describe('audioElements', () => {
  it('collects only audio tracks', () => {
    expect(
      audioElements({
        tracks: [
          { key: 'v', type: 'video', metadata: null, elements: [] },
          { key: 'a', type: 'audio', metadata: null, elements: [music] }
        ]
      })
    ).toEqual([music]);
  });
});
