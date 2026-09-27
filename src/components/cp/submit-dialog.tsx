'use client';

import { useState } from 'react';
import { Camera, Loader2, Mic, Send, Sparkles } from 'lucide-react';
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

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast({
        title: 'Please describe the problem first',
        description: 'Any language works — Hindi, Tamil, Bengali, English…',
      });
      return;
    }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg sm:rounded-2xl">
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
              placeholder="अपनी भाषा में लिखें… / உங்கள் மொழியில் எழுதுங்கள்… / Write in your own language…"
              className="text-sm"
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

          <TooltipProvider>
            <div className="flex gap-2">
              {[
                { Icon: Mic, label: 'Voice note' },
                { Icon: Camera, label: 'Photo' },
              ].map(({ Icon, label }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      className="h-8 gap-1.5 border-dashed border-slate-300 text-xs text-slate-400"
                      aria-label={`${label} upload (demo stub)`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    MVP demo: voice notes arrive pre-transcribed; photo ingestion is v2.
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
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
