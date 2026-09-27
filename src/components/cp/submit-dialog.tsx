'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Mic, Send, Sparkles, Square, X } from 'lucide-react';
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
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'en-IN', label: 'English' },
];

interface SubmitDialogProps {
  open: boolean;
  constituencyId: string;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (state: DashboardState, summary: string, isNewIssue: boolean) => void;
}

const SAMPLES: { label: string; text: string }[] = [
  {
    label: 'Marathi sample',
    text: 'वॉर्ड ११ मधील पार्कमधील खेळण्याचे उपकरण तुटले आहेत. मुलांना दुखापती होत आहेत.',
  },
  {
    label: 'Hindi sample',
    text: 'वार्ड 6 में सार्वजनिक शौचालय एक महीने से बंद पड़ा है, महिलाओं को बहुत परेशानी हो रही है।',
  },
  {
    label: 'English sample',
    text: 'The footbridge at Ward 10 railway crossing has a broken step and rusty railing. School children use it daily, it is very dangerous.',
  },
  {
    label: 'Hindi farmer sample',
    text: 'कालमना मंडी जाने वाला वार्ड 15 का रस्ता कीचड़ से भरा है। मेरी सोयाबीन की फसल ट्रैक्टर-ट्रॉली में लादकर खड़ी है, मंडी नहीं पहुंच रही।',
  },
];

const OCCUPATION_OPTIONS = [
  { value: 'auto', label: 'Auto — infer from my complaint' },
  { value: 'farmer', label: '🌾 Farmer / कृषी' },
  { value: 'general', label: 'General citizen' },
];

export function SubmitDialog({ open, constituencyId, onOpenChange, onSubmitted }: SubmitDialogProps) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('WhatsApp');
  const [occupation, setOccupation] = useState<'auto' | 'farmer' | 'general'>('auto');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('mr-IN');
  // Module 7 — photo evidence (AI vision analysis)
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<{
    description: string;
    suggestedCategory: string | null;
    severityEvidence: string;
    confidence: string;
  } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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

  // Module 7 — pick a photo, then run the AI vision analysis immediately
  const onPhotoPick = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Unsupported format', description: 'Attach a JPG, PNG or WebP photo.' });
      return;
    }
    if (file.size > 4_000_000) {
      toast({ title: 'Photo too large', description: 'Please attach an image under 4 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPhotoData(dataUrl);
      setPhotoAnalysis(null);
      setPhotoBusy(true);
      fetch('/api/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!d.ok) throw new Error(d.error ?? 'failed');
          setPhotoAnalysis(d.analysis);
        })
        .catch(() => {
          setPhotoAnalysis(null);
          toast({
            title: 'Photo analysis unavailable',
            description: 'You can still submit — the photo will be attached without AI analysis.',
          });
        })
        .finally(() => setPhotoBusy(false));
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoData(null);
    setPhotoAnalysis(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

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
    if (!trimmed && !photoAnalysis) {
      toast({
        title: 'Please describe the problem first',
        description: 'Any language works — Marathi, Hindi, English… or just attach a photo.',
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
          constituencyId,
          submitterProfile: occupation === 'auto' ? undefined : occupation,
          photoAnalysis: photoAnalysis
            ? `${photoAnalysis.description} Visible severity: ${photoAnalysis.severityEvidence}`
            : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed');
      const c = data.complaint;
      onSubmitted(
        data.state as DashboardState,
        `${c.aiClassified ? 'AI classified' : 'Classified'}: ${c.category} · urgency ${c.urgency} · ${c.ward} — ${
          data.isNewIssue ? 'new issue opened' : 'merged into existing issue'
        }${photoAnalysis ? ' · 📷 photo evidence attached' : ''}`,
        data.isNewIssue,
      );
      setText('');
      setName('');
      clearPhoto();
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
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto border-[#374151] sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            Submit a complaint
            <span className="rounded-full bg-amber-950/70 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-800">
              any language
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-gray-400">
            This runs the live AI pipeline: translation → category → urgency → ward
            extraction → duplicate matching. Watch it land in the feed and cluster
            instantly.
          </DialogDescription>
          <p className="flex items-start gap-1.5 rounded-md border border-[#374151] bg-[#111827]/70 px-2.5 py-1.5 text-[11px] leading-snug text-gray-400">
            📞 Production intake design: phone OTP verification + per-number rate
            limiting — keeps bots and repeat submitters out of the ranking
            (documented requirement; simulated in this demo).
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="complaint-text" className="text-xs font-semibold text-gray-300">
              Describe the problem
            </Label>
            <Textarea
              id="complaint-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="बोला किंवा लिहा… / बोलिए या लिखिए… / Speak or write in your own language…"
              className={`border-[#374151] bg-[#111827] text-sm text-white placeholder:text-gray-600 focus-visible:ring-amber-600/40 ${listening ? 'border-red-600 ring-2 ring-red-900/60' : ''}`}
              disabled={busy}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setText(s.text)}
                  disabled={busy}
                  className="rounded-full border border-[#374151] bg-[#111827] px-2.5 py-1 text-[11px] font-medium text-gray-400 transition-colors hover:border-amber-700 hover:text-amber-400 disabled:opacity-50"
                >
                  Try {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice input — browser-native Web Speech API (demo stopgap; production: AI4Bharat IndicConformer) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#374151] bg-[#111827] px-2 py-1.5">
              <Button
                type="button"
                size="sm"
                onClick={toggleListen}
                disabled={busy}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                className={`h-8 gap-1.5 px-2.5 text-xs font-semibold ${
                  listening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-[#4B5563] bg-[#1F2937] text-gray-200 hover:bg-[#374151]'
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
                  className="h-8 w-[110px] border-[#374151] bg-[#111827] text-xs text-gray-200"
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
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                Listening — speak now
              </span>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Attach a photo of the problem"
              onChange={(e) => onPhotoPick(e.target.files?.[0])}
              disabled={busy || photoBusy}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => photoInputRef.current?.click()}
              disabled={busy || photoBusy}
              className="h-8 gap-1.5 border border-[#4B5563] bg-[#1F2937] px-2.5 text-xs font-semibold text-gray-200 hover:bg-[#374151]"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              {photoData ? '📷 Photo attached' : '📷 Photo'}
            </Button>
          </div>
          <p className="text-[10px] leading-snug text-gray-600">
            Voice runs on the browser-native Web Speech API (Chrome/Edge) — a
            stopgap that proves the UX; production swaps in AI4Bharat&apos;s
            open-source IndicConformer ASR for all 22 scheduled languages.
            Photos are analyzed by the vision model on our server — the analysis
            travels with the complaint as evidence for the classifier and any
            later dispute.
          </p>

          {/* Module 7 — photo preview + AI vision analysis card */}
          {photoData && (
            <div className="rounded-lg border border-[#374151] bg-[#111827] p-2.5">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoData}
                  alt="Attached complaint photo preview"
                  className="h-16 w-16 shrink-0 rounded-md object-cover ring-1 ring-[#4B5563]"
                />
                <div className="min-w-0 flex-1">
                  {photoBusy ? (
                    <p className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      AI vision analyzing the photo — damage, category, severity…
                    </p>
                  ) : photoAnalysis ? (
                    <div className="space-y-1.5">
                      <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-emerald-400">
                        ✓ Photo analyzed
                        {photoAnalysis.suggestedCategory && (
                          <span className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-800">
                            suggests: {photoAnalysis.suggestedCategory}
                          </span>
                        )}
                        <span className="rounded-full bg-[#374151] px-2 py-0.5 text-[10px] font-semibold text-gray-300">
                          {photoAnalysis.confidence} confidence
                        </span>
                      </p>
                      <p className="text-xs leading-snug text-gray-300">
                        {photoAnalysis.description}
                      </p>
                      <p className="text-[11px] italic leading-snug text-amber-400/90">
                        Severity evidence: {photoAnalysis.severityEvidence}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Analysis unavailable — the photo will still be attached to
                      your complaint.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearPhoto}
                  disabled={busy}
                  aria-label="Remove attached photo"
                  className="shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-[#374151] hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {!text.trim() && photoAnalysis && !busy && (
                <p className="mt-2 rounded-md bg-[#1F2937] px-2 py-1 text-[10px] font-medium text-gray-400">
                  Tip: no words needed — submit with just this photo and the
                  vision analysis stands in as your complaint.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="citizen-name" className="text-xs font-semibold text-gray-300">
                Your name (optional)
              </Label>
              <Input
                id="citizen-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shobha Charate"
                className="border-[#374151] bg-[#111827] text-sm text-white placeholder:text-gray-600"
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-300">Channel</Label>
              <Select value={channel} onValueChange={setChannel} disabled={busy}>
                <SelectTrigger className="border-[#374151] bg-[#111827] text-sm text-white">
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

          {/* Module 5 — occupation (priority weighting) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-300">
              Occupation — affects priority weighting
            </Label>
            <Select
              value={occupation}
              onValueChange={(v) => setOccupation(v as 'auto' | 'farmer' | 'general')}
              disabled={busy}
            >
              <SelectTrigger
                className="border-[#374151] bg-[#111827] text-sm text-white"
                aria-label="Occupation"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OCCUPATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="rounded-md border border-lime-900/60 bg-lime-950/20 px-2.5 py-1.5 text-[10px] leading-snug text-lime-300/90">
              🌾 Why we ask: urgency windows differ by occupation. A farmer&apos;s road
              complaint is harvest transport — income at risk on a seasonal
              deadline (Roads ×1.4) — while health leads by default for everyone
              (×1.3). Same complaint, different occupation → different priority.
              Leave on Auto and the engine infers it from your own words.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="text-gray-400 hover:bg-[#374151] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={busy || photoBusy || (!text.trim() && !photoAnalysis)}
            className="gap-1.5 bg-amber-600 font-semibold text-white hover:bg-amber-500"
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
