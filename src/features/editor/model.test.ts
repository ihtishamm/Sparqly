import { describe, expect, it } from 'vitest';
import {
  baseClips,
  canSplit,
  clipAt,
  docDuration,
  removeBaseClip,
  sourceSecondsAt,
  splitElement,
  toSaveBody,
  trimBaseEnd,
  trimBaseStart,
  type Doc,
  type El
} from './model';

const el = (over: Partial<El> & Pick<El, 'key' | 'type'>): El => ({
  startTimeMs: 0,
  endTimeMs: 1000,
  layer: 0,
  properties: {},
  assetId: null,
  ...over
});

/** A 10 s clip (source 5–15 s) with two captions and a music bed. */
function sample(): Doc {
  return {
    tracks: [
      {
        key: 'tv',
        type: 'video',
        metadata: null,
        elements: [
          el({
            key: 'clip',
            type: 'video',
            endTimeMs: 10_000,
            properties: { sourceStartMs: 5000, sourceEndMs: 15_000 }
          })
        ]
      },
      {
        key: 'tt',
        type: 'text',
        metadata: null,
        elements: [
          el({
            key: 'c1',
            type: 'text',
            startTimeMs: 0,
            endTimeMs: 2000,
            properties: {
              text: 'one two',
              words: [
                { text: 'one', startMs: 0, endMs: 900 },
                { text: 'two', startMs: 1000, endMs: 1900 }
              ]
            }
          }),
          el({
            key: 'c2',
            type: 'text',
            startTimeMs: 6000,
            endTimeMs: 8000,
            properties: { text: 'later' }
          })
        ]
      },
      {
        key: 'ta',
        type: 'audio',
        metadata: null,
        elements: [
          el({
            key: 'music',
            type: 'audio',
            startTimeMs: 0,
            endTimeMs: 10_000,
            properties: { sourceStartMs: 0, volume: 0.5 }
          })
        ]
      }
    ]
  };
}

const find = (doc: Doc, key: string) =>
  doc.tracks.flatMap((t) => t.elements).find((e) => e.key === key);

describe('splitElement', () => {
  it('splits a clip into two that keep their place in the source', () => {
    const doc = splitElement(sample(), 'clip', 4000);
    const [a, b] = baseClips(doc);
    expect(a).toMatchObject({ key: 'clip', startTimeMs: 0, endTimeMs: 4000 });
    expect(a.properties).toMatchObject({
      sourceStartMs: 5000,
      sourceEndMs: 9000
    });
    expect(b).toMatchObject({ startTimeMs: 4000, endTimeMs: 10_000 });
    expect(b.key).not.toBe('clip');
    expect(b.properties).toMatchObject({
      sourceStartMs: 9000,
      sourceEndMs: 15_000
    });
    expect(docDuration(doc)).toBe(10_000);
  });

  it('divides caption words between the halves', () => {
    const doc = splitElement(sample(), 'c1', 1000);
    const texts = doc.tracks[1].elements.map((e) => e.properties.text);
    expect(texts.slice(0, 2)).toEqual(['one', 'two']);
    expect(doc.tracks[1].elements[1].properties.words).toHaveLength(1);
  });

  it('refuses a split too close to an edge', () => {
    const clip = baseClips(sample())[0];
    expect(canSplit(clip, 100)).toBe(false);
    expect(canSplit(clip, 5000)).toBe(true);
    expect(splitElement(sample(), 'clip', 100)).toEqual(sample());
  });
});

describe('trimming base clips', () => {
  it('trims the second clip’s start and ripples what follows', () => {
    const split = splitElement(sample(), 'clip', 4000);
    const second = baseClips(split)[1];
    const doc = trimBaseStart(split, second.key, 1000);
    const [a, b] = baseClips(doc);
    expect(a.endTimeMs).toBe(4000);
    expect(b).toMatchObject({ startTimeMs: 4000, endTimeMs: 9000 });
    expect(b.properties.sourceStartMs).toBe(10_000);
    // The caption at 6–8 s moved left with the footage.
    expect(find(doc, 'c2')).toMatchObject({
      startTimeMs: 5000,
      endTimeMs: 7000
    });
    // The music starts before the trimmed clip, so it stays.
    expect(find(doc, 'music')).toMatchObject({ startTimeMs: 0 });
  });

  it('drops captions inside the cut and clamps ones that straddle it', () => {
    const doc = trimBaseStart(sample(), 'clip', 2500);
    expect(find(doc, 'c1')).toBeUndefined();
    expect(find(doc, 'c2')).toMatchObject({ startTimeMs: 3500 });
    expect(baseClips(doc)[0]).toMatchObject({
      startTimeMs: 0,
      endTimeMs: 7500
    });
  });

  it('shortens a clip end and pulls later clips in', () => {
    const split = splitElement(sample(), 'clip', 4000);
    const doc = trimBaseEnd(split, 'clip', 3000);
    const [a, b] = baseClips(doc);
    expect(a).toMatchObject({ endTimeMs: 3000 });
    expect(a.properties.sourceEndMs).toBe(8000);
    expect(b).toMatchObject({ startTimeMs: 3000, endTimeMs: 9000 });
    expect(find(doc, 'c2')).toMatchObject({ startTimeMs: 5000 });
  });
});

describe('removeBaseClip', () => {
  it('removes a clip, its captions, and closes the gap', () => {
    const split = splitElement(sample(), 'clip', 4000);
    const doc = removeBaseClip(split, 'clip');
    expect(baseClips(doc)).toHaveLength(1);
    expect(baseClips(doc)[0]).toMatchObject({
      startTimeMs: 0,
      endTimeMs: 6000
    });
    expect(find(doc, 'c1')).toBeUndefined();
    expect(find(doc, 'c2')).toMatchObject({ startTimeMs: 2000 });
  });

  it('keeps the only clip', () => {
    expect(removeBaseClip(sample(), 'clip')).toEqual(sample());
  });
});

describe('playback mapping', () => {
  it('maps timeline time into the right clip’s source', () => {
    const split = splitElement(sample(), 'clip', 4000);
    const second = baseClips(split)[1];
    const doc = trimBaseStart(split, second.key, 1000);
    expect(clipAt(doc, 3000)?.key).toBe('clip');
    expect(sourceSecondsAt(clipAt(doc, 3000)!, 3000)).toBe(8);
    expect(sourceSecondsAt(clipAt(doc, 4500)!, 4500)).toBe(10.5);
    // Past the end: the last frame of the last clip.
    expect(clipAt(doc, 20_000)?.key).toBe(second.key);
  });
});

describe('toSaveBody', () => {
  it('sends base clips in time order without editor keys', () => {
    const doc = splitElement(sample(), 'clip', 4000);
    const body = toSaveBody({
      tracks: [
        { ...doc.tracks[0], elements: [...doc.tracks[0].elements].reverse() },
        ...doc.tracks.slice(1)
      ]
    });
    const video = body.tracks[0].elements;
    expect(video.map((e) => e.startTimeMs)).toEqual([0, 4000]);
    expect(video[0]).not.toHaveProperty('key');
  });
});
