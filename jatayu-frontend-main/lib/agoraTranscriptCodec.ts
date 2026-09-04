import { Field, Type } from 'protobufjs/light';
import type { TranscriptSegment } from '@/lib/agoraTranscriptApi';

const Word = new Type('Word')
  .add(new Field('text', 1, 'string'))
  .add(new Field('startMs', 2, 'int32'))
  .add(new Field('durationMs', 3, 'int32'))
  .add(new Field('isFinal', 4, 'bool'))
  .add(new Field('confidence', 5, 'double'));

const Text = new Type('Text')
  .add(new Field('vendor', 1, 'int32'))
  .add(new Field('version', 2, 'int32'))
  .add(new Field('seqnum', 3, 'int32'))
  .add(new Field('uid', 4, 'uint32'))
  .add(new Field('flag', 5, 'int32'))
  .add(new Field('time', 6, 'uint64'))
  .add(new Field('lang', 7, 'int32'))
  .add(new Field('starttime', 8, 'int32'))
  .add(new Field('offtime', 9, 'int32'))
  .add(new Field('words', 10, 'Word', 'repeated'))
  .add(new Field('endOfSegment', 11, 'bool'))
  .add(new Field('durationMs', 12, 'int32'))
  .add(new Field('dataType', 13, 'string'));
Text.add(Word);

export function decodeAgoraTranscript(payload: Uint8Array): TranscriptSegment | null {
  try {
    const decoded = Text.toObject(Text.decode(payload), { longs: Number, defaults: true }) as Record<string, unknown>;
    if (decoded.dataType !== 'transcribe' || !Array.isArray(decoded.words)) return null;
    const words = decoded.words as Array<Record<string, unknown>>;
    const text = words.map((word) => String(word.text || '')).join('').trim();
    if (!text) return null;
    return {
      speakerUid: String(decoded.uid),
      sequence: Number(decoded.seqnum || 0),
      startMs: Number(decoded.starttime || 0),
      durationMs: Number(decoded.durationMs || 0),
      text,
      confidence: null,
      isFinal: Boolean(decoded.endOfSegment) || words.every((word) => Boolean(word.isFinal)),
      providerTimestamp: Number(decoded.time || 0),
    };
  } catch {
    return null;
  }
}
