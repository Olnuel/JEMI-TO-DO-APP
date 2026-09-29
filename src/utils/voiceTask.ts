import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Voice task capture via the Web Speech API.
 *
 * Browser support is genuinely uneven — notably Safari and Firefox on
 * desktop do not implement SpeechRecognition at all. Every entry point
 * checks `isSupported` first so the UI can hide rather than dead-click.
 */

/* ------------------------------ types ------------------------------- */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const isVoiceSupported = (): boolean => getRecognitionCtor() !== null;

export type VoiceErrorKind =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'unsupported'
  | 'unknown';

export interface VoiceError {
  kind: VoiceErrorKind;
  message: string;
}

const ERROR_COPY: Record<VoiceErrorKind, string> = {
  'not-allowed':
    'Microphone access was blocked. Allow it in your browser settings, then try again.',
  'no-speech': "I didn't catch that. Hold your device closer and speak again.",
  network: 'Speech recognition needs a network connection and could not reach it.',
  aborted: 'Listening was cancelled.',
  unsupported:
    'This browser does not support voice input. Try Chrome or Edge, or Safari on iPhone.',
  unknown: 'Something went wrong while listening. Please try again.',
};

/* --------------------------- date parsing ---------------------------- */

export interface ParsedVoice {
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: 'urgent' | 'important' | 'soft' | 'chill';
  matchedPhrase?: string;
}

const WEEKDAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function time24(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Pulls a date/time and priority out of a spoken phrase.
 *
 * Deliberately conservative: anything it is not confident about is
 * left in the title so the user can see and fix it. Silently guessing
 * the wrong due date is worse than no due date.
 */
export function parseVoiceCommand(input: string): ParsedVoice {
  let text = input.trim();
  let dueDate: string | undefined;
  let dueTime: string | undefined;
  let priority: ParsedVoice['priority'];
  const found: string[] = [];

  const cut = (pattern: RegExp) => {
    pattern.lastIndex = 0;
    const m = text.match(pattern);
    if (m) {
      found.push(m[0]);
      text = text.replace(pattern, ' ');
    }
    return m;
  };

  const now = new Date();
  const today = isoDate(now);

  // Priority cues. Every matching phrase is stripped from the title, but
  // only the strongest one wins — "maybe do it someday" sets chill even
  // though both soft and chill words were present.
  const PRIORITY_CUES: [ParsedVoice['priority'], RegExp][] = [
    ['urgent', /\b(asap|emergency|immediately|right away|urgent)\b/i],
    ['important', /\b(important|priority|critical|must do)\b/i],
    ['chill', /\b(chill|someday|eventually|low priority|one day)\b/i],
    ['soft', /\b(some ?time|whenever|no rush|if i get a chance|flexible|maybe)\b/i],
  ];
  for (const [level, re] of PRIORITY_CUES) {
    const hit = cut(re);
    if (hit && !priority) priority = level;
  }

  // ISO date, e.g. 2026-09-30
  const iso = cut(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) dueDate = isoDate(new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));

  // "sept 30" / "sep 30th"
  const monthNames =
    'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
  const monthDay = new RegExp(`\\b(${monthNames})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
  const md = cut(monthDay);
  if (md) {
    const idx = monthNames.indexOf(md[1].slice(0, 3).toLowerCase());
    const names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = names.indexOf(names[idx]) >= 0 ? names[idx] : names.find((n) => md[1].toLowerCase().startsWith(n)) ?? 'jan';
    const mIdx = names.indexOf(month);
    const d = new Date(now.getFullYear(), mIdx >= 0 ? mIdx : 0, Number(md[2]));
    if (d.getMonth() === (mIdx >= 0 ? mIdx : 0) && d.getDate() === Number(md[2])) {
      if (d < new Date(today + 'T00:00:00')) d.setFullYear(d.getFullYear() + 1);
      dueDate = isoDate(d);
    }
  }

  // "on the 15th" / "on the 3rd"
  const ordinal = cut(/\bon the (\d{1,2})(?:st|nd|rd|th)\b/i);
  if (ordinal) {
    const day = Number(ordinal[1]);
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if (d.getDate() === day) {
      if (d < new Date(today + 'T00:00:00')) d.setMonth(d.getMonth() + 1);
      dueDate = isoDate(d);
    }
  }

  // Relative days
  let eveningHint = false;
  const relDay = cut(/\b(today|tonight|this morning|this afternoon|this evening)\b/i);
  if (relDay) {
    dueDate = today;
    const w = relDay[1].toLowerCase();
    if (w === 'this morning') dueTime = '09:00';
    else if (w === 'this afternoon') dueTime = '14:00';
    else if (w === 'this evening' || w === 'tonight') {
      dueTime = '20:00';
      eveningHint = true;
    }
  } else if (cut(/\btomorrow\b/i)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    dueDate = isoDate(d);
  } else if (cut(/\bday after tomorrow\b/i)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    dueDate = isoDate(d);
  } else if (cut(/\bnext week\b/i)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    dueDate = isoDate(d);
  }

  // Weekday: "on friday" -> the next such day
  for (const day of WEEKDAYS) {
    const re = new RegExp(`\\bon (?:${day})\\b`, 'i');
    if (cut(re)) {
      const target = WEEKDAYS.indexOf(day);
      const d = new Date(now);
      let delta = (target - d.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      d.setDate(d.getDate() + delta);
      dueDate = isoDate(d);
      break;
    }
  }

  // Named times set a default that a more specific clock time overrides,
  // so "tonight at 6" becomes 18:00 rather than the 20:00 default.
  if (cut(/\bnoon\b/i) || cut(/\bmidday\b/i)) dueTime = '12:00';
  else if (cut(/\bmidnight\b/i)) dueTime = '00:00';

  // Only a spoken clock time counts as explicit. A named default like
  // "tonight" must still be overridable by "tonight at 6".
  let explicitTime = false;

  // "5pm" / "5:30 pm" / "17:00"
  const timeMatch = cut(
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(?:at\s+)?(\d{1,2}):(\d{2})\b/i,
  );
  if (timeMatch) {
    const [, h1, m1, ap, h2, m2] = timeMatch;
    if (ap) {
      let hour = Number(h1);
      if (ap.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (ap.toLowerCase() === 'am' && hour === 12) hour = 0;
      dueTime = time24(hour, Number(m1 ?? 0));
      explicitTime = true;
    } else {
      const hour = Number(h2);
      if (hour >= 0 && hour <= 23) {
        dueTime = time24(hour, Number(m2 ?? 0));
        explicitTime = true;
      }
    }
  }

  // "at 7" / "at 19" — a bare hour after the word "at" is a time, not a
  // quantity. Requires the "at" prefix so "buy 7 apples" stays intact.
  // Evening context disambiguates the 12-hour form: "tonight at 6" is
  // 18:00, not 06:00.
  if (!explicitTime) {
    const bareHour = cut(/\bat\s+(\d{1,2})\b(?!\s*[:.]?\s*\d)/i);
    if (bareHour) {
      let hour = Number(bareHour[1]);
      if (eveningHint && hour >= 1 && hour <= 7) hour += 12;
      if (hour >= 0 && hour <= 23) dueTime = time24(hour, 0);
    }
  }

  // Drop extra times orphaned by a list, e.g. "at 7am and 8pm".
  text = text
    .replace(/\b(?:and|,)?\s*\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ');

  // Default a time to today so "at 5pm" isn't silently tomorrow.
  if (dueTime && !dueDate) dueDate = today;

  const title = text
    .replace(/\b(on|at|by|due|before)\b\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim();

  return {
    // Never hand back an empty title: an untitled task is unusable, and
    // speech can mishear a short phrase into nothing.
    title: title || input.trim() || 'Voice task',
    dueDate,
    dueTime,
    priority,
    matchedPhrase: found.length ? found.join(' · ') : undefined,
  };
}

/* ------------------------------- hook -------------------------------- */

export interface UseVoiceTaskOptions {
  onComplete: (parsed: ParsedVoice, rawTranscript: string) => void;
  lang?: string;
  onError?: (err: VoiceError) => void;
}

export function useVoiceTask({ onComplete, lang = 'en-US', onError }: UseVoiceTaskOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Guards against onend firing a second time after a manual stop.
  const finalisingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    [],
  );

  const stop = useCallback(() => {
    finalisingRef.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      const err = { kind: 'unsupported' as const, message: ERROR_COPY.unsupported };
      setError(err);
      onErrorRef.current?.(err);
      return;
    }
    if (isListening) {
      stop();
      return;
    }

    setError(null);
    setInterim('');
    finalisingRef.current = false;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = '';

    rec.onstart = () => setIsListening(true);

    rec.onresult = (e) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += text;
        else live += text;
      }
      setInterim(live);
    };

    rec.onerror = (e) => {
      const kind = (['not-allowed', 'no-speech', 'network', 'aborted'].includes(e.error)
        ? e.error
        : 'unknown') as VoiceErrorKind;
      const err = { kind, message: e.message || ERROR_COPY[kind] };
      // An abort is our own doing, not a failure worth showing.
      if (kind !== 'aborted') {
        setError(err);
        onErrorRef.current?.(err);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterim('');
      recognitionRef.current = null;
      if (finalisingRef.current) {
        finalisingRef.current = false;
        return;
      }
      const trimmed = finalText.trim();
      if (trimmed) onCompleteRef.current(parseVoiceCommand(trimmed), trimmed);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() throws if called while already running.
      setIsListening(false);
    }
  }, [isListening, lang, stop]);

  const resetError = useCallback(() => setError(null), []);

  return { isListening, interim, error, start, stop, resetError, supported: isVoiceSupported() };
}
