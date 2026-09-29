import React, { useEffect } from 'react';
import { Mic, Square, Loader2, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { useVoiceTask, ParsedVoice, isVoiceSupported } from '../utils/voiceTask';

interface VoiceAddButtonProps {
  onCreate: (parsed: ParsedVoice, rawTranscript: string) => void;
  soundEnabled: boolean;
  playPop: () => void;
  playSparkle: () => void;
}

export const VoiceAddButton: React.FC<VoiceAddButtonProps> = ({
  onCreate,
  soundEnabled,
  playPop,
  playSparkle,
}) => {
  const supported = isVoiceSupported();
  const { isListening, interim, error, start, stop, resetError } = useVoiceTask({
    onComplete: (parsed, raw) => {
      if (soundEnabled) playSparkle();
      onCreate(parsed, raw);
    },
    onError: () => {
      if (soundEnabled) playPop();
    },
  });

  // Stop listening if the user navigates away mid-capture.
  useEffect(() => {
    if (!isListening) return;
    return () => stop();
  }, [isListening, stop]);

  if (!supported) {
    return (
      <div
        className="relative group"
        title="Voice input is not available in this browser. Chrome, Edge, or Safari on iPhone support it."
      >
        <button
          disabled
          aria-label="Voice input unavailable"
          className="p-2 rounded-xl bg-pink-50 text-stone-400 border border-pink-200 opacity-60 cursor-not-allowed"
        >
          <Mic size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          resetError();
          if (soundEnabled) playPop();
          start();
        }}
        aria-label={isListening ? 'Stop listening' : 'Add a task by voice'}
        aria-pressed={isListening}
        title={isListening ? 'Stop listening' : 'Add a task by voice'}
        className={`p-2 rounded-xl border transition-all ${
          isListening
            ? 'bg-rose-500 text-white border-rose-300 shadow-lg shadow-rose-500/50 animate-pulse'
            : 'bg-pink-50 hover:bg-pink-100 text-rose-600 border-pink-200'
        }`}
      >
        {isListening ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
      </button>

      {/* Live listening / result popover */}
      {(isListening || error) && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-pink-200 shadow-xl text-stone-800">
          {isListening ? (
            <>
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
                <Loader2 size={13} className="animate-spin" />
                Listening…
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                Try “call mum tomorrow at 6pm” or “pay rent on the 1st urgent”.
              </p>
              {interim && (
                <p className="mt-2 text-sm text-stone-700 italic font-medium leading-relaxed">
                  “{interim}”
                </p>
              )}
              <button
                onClick={stop}
                className="mt-2.5 w-full py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
              >
                Done — use what I heard
              </button>
            </>
          ) : error ? (
            <>
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                <AlertTriangle size={13} /> Couldn't hear that
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{error.message}</p>
              <button
                onClick={resetError}
                className="mt-2 text-[11px] text-rose-500 font-semibold hover:underline"
              >
                Dismiss
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

/** Confirmation shown briefly after a voice task is created. */
export const VoiceCreatedToast: React.FC<{ parsed: ParsedVoice }> = ({ parsed }) => (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-pink-200 shadow-xl text-stone-800 max-w-sm">
    <div className="flex items-center gap-2">
      <span className="text-lg"><Check size={16} className="text-emerald-500" /></span>
      <p className="text-xs font-bold text-rose-900 truncate">{parsed.title}</p>
    </div>
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      {parsed.dueDate && (
        <span className="px-1.5 py-0.5 rounded-md bg-pink-100 text-rose-700 text-[10px] font-bold">
          📅 {parsed.dueDate}
          {parsed.dueTime ? ` ${parsed.dueTime}` : ''}
        </span>
      )}
      {parsed.priority && (
        <span className="px-1.5 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-700 text-[10px] font-bold">
          <Sparkles size={9} className="inline" /> {parsed.priority}
        </span>
      )}
    </div>
    {parsed.matchedPhrase && (
      <p className="text-[10px] text-stone-400 mt-1.5">
        heard: “{parsed.matchedPhrase}” — removed from the title
      </p>
    )}
  </div>
);
