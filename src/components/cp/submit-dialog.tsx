'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Mic, Phone, Send, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { DashboardState } from '@/lib/types';

// ── Minimal Web Speech API typings (browser-native, no extra deps) ─────────
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  length: number;
  0: SRAlternative;
}
interface SREvent {
  resultIndex: number;
  results: { length: number; [index: number]: SRResult };
}
interface SRLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SRCtor = new () => SRLike;

function getSRCtor(): SRCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const VOICE_LANGS: { code: string; label: string }[] = [
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'en-IN', label: 'English' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'bn-IN', label: 'বাংলা' },
  { code: 'mr-IN', label: 'मराठी' },
];

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (state: DashboardState, summary: string, isNewIssue: boolean) => void;
}

const SAMPLES: { label: string; text: string }[] = [
  {
    label: 'Tamil sample',
    text: 'வார்டு 4 பேருந்து நிறுத்தத்தில் மழைக்கால தண்ணீர் தேங்கி நிற்கிறது. மாணவர்கள் பள்ளிக்கு செல்லவே முடியவில்லை. டிரைன் அடைப்பு இல்லை.',
  },
  {
    label: 'Hindi sample',
    text: 'वार्ड 6 में सार्वजनिक शौचालय एक महीने से बंद पड़ा है, महिलाओं को बहुत परेशानी हो रही है। कृपया जल्दी कार्रवाई करें।',
  },
  {
    label: 'English sample',
    text: 'The footbridge at Ward 10 railway crossing has a broken step and rusty railing. School children use it daily, it is very dangerous.',
  },
];

export function SubmitDialog({ open, onOpenChange, onSubmitted }: SubmitDialogProps) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('WhatsApp');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('hi-IN');

  const recognitionRef = useRef<SRLike | null>(null);
  const baseTextRef = useRef('');
  const finalRef = useRef('');

  // Stop any live recognition when the dialog closes/unmounts
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const toggleListen = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSRCtor();
    if (!Ctor) {
      toast({
        title: 'Voice input not supported in this browser',
        description: 'Use Chrome or Edge — the Web Speech API is browser-native.',
      });
      return;
    }
    const rec = new Ctor();
    rec.lang = voiceLang;
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = text;
    finalRef.current = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + ' ';
        else interim += r[0].transcript;
      }
      setText(
        [baseTextRef.current, finalRef.current, interim]
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
      );
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast({
          title: 'Microphone blocked',
          description: 'Allow mic access in the browser, then try again.',
        });
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      toast({ title: 'Could not start the microphone' });
    }
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast({
        title: 'Please describe the problem first',
        description: 'Any language works — Hindi, Tamil, Bengali, English…',
      });
      return;
    }
    recognitionRef.current?.stop();
    setBusy(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          submittedBy: name.trim() || 'Anonymous citizen',
          source: channel,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed');
      const c = data.complaint;
      onSubmitted(
        data.state as DashboardState,
        `${c.aiClassified ? 'AI classified' : 'Classified'}: ${c.category} · urgency ${c.urgency} · ${c.ward} — ${
          data.isNewIssue ? 'new issue opened' : 'merged into existing issue'
        }`,
        data.isNewIssue,
      );
      setText('');
      setName('');
      onOpenChange(false);
    } catch {
      toast({ title: 'Submission failed', description: 'Please try again in a moment.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) recognitionRef.current?.stop();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            Submit a complaint
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              any language
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-slate-500">
            This runs the live AI pipeline: translation → category → urgency → ward extraction →
            duplicate matching. Watch it land in the feed and cluster instantly.
          </DialogDescription>
          <p className="flex items-start gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] leading-snug text-slate-500">
            <Phone className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            Production intake design: phone OTP verification + per-number rate
            limiting — keeps bots and repeat submitters out of the ranking
            (documented requirement; simulated in this demo).
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="complaint-text" className="text-xs font-semibold text-slate-600">
              Describe the problem
            </Label>
            <Textarea
              id="complaint-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="बोलिए या लिखिए… / பேசுங்கள் அல்லது எழுதுங்கள்… / Speak or write in your own language…"
              className={`text-sm ${listening ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              disabled={busy}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setText(s.text)}
                  disabled={busy}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                >
                  Try {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice input — browser-native Web Speech API (demo stopgap; production: AI4Bharat IndicConformer) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
              <Button
                type="button"
                size="sm"
                onClick={toggleListen}
                disabled={busy}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                className={`h-8 gap-1.5 px-2.5 text-xs font-semibold ${
                  listening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {listening ? (
                  <>
                    <Square className="h-3 w-3" aria-hidden />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" aria-hidden />
                    Speak
                  </>
                )}
              </Button>
              <Select
                value={voiceLang}
                onValueChange={setVoiceLang}
                disabled={busy || listening}
              >
                <SelectTrigger
                  className="h-8 w-[110px] border-slate-300 text-xs"
                  aria-label="Voice input language"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_LANGS.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {listening && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                Listening — speak now
              </span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 gap-1.5 border-dashed border-slate-300 text-xs text-slate-400"
                    aria-label="Photo upload (demo stub)"
                  >
                    <Camera className="h-3.5 w-3.5" aria-hidden />
                    Photo
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  MVP: photo ingestion is v2 — placeholder icon only.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-[10px] leading-snug text-slate-400">
            Voice runs on the browser-native Web Speech API (Chrome/Edge) — a
            stopgap that proves the UX. Production swaps in AI4Bharat&apos;s
            open-source IndicConformer ASR for all 22 scheduled languages.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="citizen-name" className="text-xs font-semibold text-slate-600">
                Your name (optional)
              </Label>
              <Input
                id="citizen-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lakshmi R."
                className="text-sm"
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Channel</Label>
              <Select value={channel} onValueChange={setChannel} disabled={busy}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['WhatsApp', 'Phone', 'Letter', 'Walk-in', 'App', 'Voice note'].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={busy || !text.trim()}
            className="gap-1.5 bg-emerald-700 font-semibold text-white hover:bg-emerald-800"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                AI analyzing…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden />
                Submit
                <Sparkles className="h-3 w-3 opacity-70" aria-hidden />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
