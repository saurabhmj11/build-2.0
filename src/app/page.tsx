'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/cp/header';
import { EntryScreen } from '@/components/cp/entry-screen';
import { FundStrip } from '@/components/cp/fund-strip';
import { VerificationStrip } from '@/components/cp/verification-strip';
import { WardMap } from '@/components/cp/ward-map';
import { LiveFeed } from '@/components/cp/live-feed';
import { IssueCard } from '@/components/cp/issue-card';
import { ReportDialog } from '@/components/cp/report-dialog';
import { SubmitDialog } from '@/components/cp/submit-dialog';
import { InfraDialog } from '@/components/cp/infra-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/lib/types';
import { Category, DashboardState, IssueView } from '@/lib/types';
import {
  CONSTITUENCIES,
  isLiveConstituency,
} from '@/lib/constituencies';

export default function Home() {
  const { toast } = useToast();
  // Entry screen → dashboard is the ONLY navigation step (DESIGN.md)
  const [constituencyId, setConstituencyId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<DashboardState | null>(null);
  const [liveOn, setLiveOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reportIssue, setReportIssue] = useState<IssueView | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [infraOpen, setInfraOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [wardFilter, setWardFilter] = useState<string | null>(null);
  const processingRef = useRef(false);

  // Restore deep link (?c=nagpur) on mount
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    if (isLiveConstituency(c)) selectConstituency(c);
    setHydrated(true);
  }, []);

  const selectConstituency = useCallback((id: string) => {
    setConstituencyId(id);
    setState(null);
    setLiveOn(false);
    setCategoryFilter('All');
    setWardFilter(null);
    setReportOpen(false);
    setReportIssue(null);
    window.history.replaceState(null, '', `/?c=${id}`);
  }, []);

  const backToEntry = useCallback(() => {
    setConstituencyId(null);
    setState(null);
    setLiveOn(false);
    window.history.replaceState(null, '', '/');
  }, []);

  const setProcessingBoth = useCallback((v: boolean) => {
    processingRef.current = v;
    setProcessing(v);
  }, []);

  // Load + background refresh for the ACTIVE constituency
  useEffect(() => {
    if (!constituencyId) return;
    let cancelled = false;
    const load = () =>
      fetch(`/api/state?c=${constituencyId}`)
        .then((r) => r.json())
        .then((d: DashboardState) => {
          if (!cancelled) setState(d);
        })
        .catch(() => undefined);
    load();
    const iv = setInterval(() => {
      if (document.hidden || processingRef.current) return;
      load();
    }, 6000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [constituencyId]);

  // Live feed simulation — client-paced, constituency-scoped
  useEffect(() => {
    if (!liveOn || !constituencyId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) return;
      if (processingRef.current) {
        timer = setTimeout(tick, 4000);
        return;
      }
      setProcessingBoth(true);
      try {
        const res = await fetch('/api/demo/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ constituencyId }),
        });
        const data = await res.json();
        if (data.ok && data.state) {
          setState(data.state as DashboardState);
          const issue = (data.state as DashboardState).issues.find(
            (i) => i.id === data.complaint.issueId,
          );
          if (data.isNewIssue) {
            toast({
              title: 'New issue opened by AI',
              description: `"${data.complaint.summaryEn}" — ${data.complaint.ward}`,
            });
          } else if (issue) {
            toast({
              title: `Clustered — "${issue.title}"`,
              description: `${issue.count} reports · ${issue.distinctCount} distinct citizens · priority ${issue.priority}${
                issue.quarantined ? ' (quarantined)' : ''
              }`,
            });
          }
        } else if (data.exhausted) {
          setLiveOn(false);
          toast({
            title: 'Live feed pool exhausted',
            description: 'Hit the reset button (top right) to replay the simulation.',
          });
          return;
        }
      } catch {
        // keep the sim alive; next tick retries
      } finally {
        setProcessingBoth(false);
      }
      if (!cancelled) timer = setTimeout(tick, 7000 + Math.random() * 3500);
    };

    timer = setTimeout(tick, 2500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [liveOn, constituencyId, setProcessingBoth, toast]);

  const complaintsByIssue = useMemo(() => {
    const map = new Map<string, DashboardState['complaints']>();
    for (const c of state?.complaints ?? []) {
      const list = map.get(c.issueId) ?? [];
      list.push(c);
      map.set(c.issueId, list);
    }
    return map;
  }, [state]);

  const handleReset = useCallback(async () => {
    if (!constituencyId) return;
    setLiveOn(false);
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constituencyId }),
      });
      const data = await res.json();
      if (data.ok) {
        setState(data.state as DashboardState);
        toast({
          title: 'Demo reset',
          description: 'Back to the seeded intake for this constituency.',
        });
      }
    } catch {
      toast({ title: 'Reset failed' });
    }
  }, [constituencyId, toast]);

  const handleSubmitted = useCallback(
    (newState: DashboardState, summary: string, isNewIssue: boolean) => {
      setState(newState);
      toast({
        title: isNewIssue
          ? 'Complaint registered — new issue opened'
          : 'Complaint registered — merged into existing issue',
        description: summary,
      });
    },
    [toast],
  );

  const openReport = useCallback((issue: IssueView) => {
    setReportIssue(issue);
    setReportOpen(true);
  }, []);

  // Keep the open issue fresh (count/rank may have changed) while its card exists
  const liveReportIssue =
    reportIssue && state ? (state.issues.find((i) => i.id === reportIssue.id) ?? reportIssue) : null;

  const presentCategories = useMemo(
    () => CATEGORIES.filter((c) => state?.issues.some((i) => i.category === c)),
    [state],
  );

  const visibleIssues = useMemo(
    () =>
      (state?.issues ?? []).filter(
        (i) =>
          (categoryFilter === 'All' || i.category === categoryFilter) &&
          (!wardFilter || i.ward === wardFilter),
      ),
    [state, categoryFilter, wardFilter],
  );

  const maxPriority = state?.issues[0]?.priority ?? 1;

  // ── Entry screen (before the dashboard) ─────────────────────────────────
  if (!constituencyId) {
    return hydrated ? (
      <EntryScreen constituencies={CONSTITUENCIES} onSelect={selectConstituency} />
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-[#111827]">
        <Skeleton className="h-8 w-48 bg-[#1F2937]" />
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#111827]">
      <Header
        constituency={state?.constituency ?? {
          id: constituencyId, name: constituencyId, city: '', state: 'Maharashtra',
          mpName: '…', party: '…',
        }}
        onSwitchConstituency={backToEntry}
        liveOn={liveOn}
        onToggleLive={setLiveOn}
        onSubmitClick={() => setSubmitOpen(true)}
        onReset={handleReset}
        onInfraClick={() => setInfraOpen(true)}
        totalComplaints={state?.totalComplaints ?? 0}
        totalIssues={state?.issues.length ?? 0}
        aiCount={state?.aiClassifiedCount ?? 0}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4">
        {!state ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-full bg-[#1F2937]" />
            <Skeleton className="h-9 w-full bg-[#1F2937]" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(330px,390px)_1fr]">
              <Skeleton className="h-[480px] bg-[#1F2937]" />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 bg-[#1F2937]" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Module 4 status — one thin dark bar */}
            <VerificationStrip summary={state.verificationSummary} />

            <WardMap
              stats={state.wardStats}
              selected={wardFilter}
              onSelect={setWardFilter}
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(330px,390px)_1fr]">
              {/* Left column — the chaos */}
              <LiveFeed complaints={state.complaints.slice(0, 40)} processing={processing} />

              {/* Right column — the signal */}
              <section aria-label="Ranked priority issues" className="flex flex-col gap-3">
                {/* Fund summary strip — thin context line above the cards (DESIGN.md) */}
                <FundStrip fund={state.fundSummary} />

                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                    📊 Priority dashboard
                  </h2>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    sorted by distinct citizens × urgency — one citizen, one vote
                    {state.livePoolRemaining > 0 && (
                      <span className="ml-1 rounded-full bg-[#1F2937] px-2 py-0.5 font-semibold text-gray-400 ring-1 ring-[#374151]">
                        {state.livePoolRemaining} in sim queue
                      </span>
                    )}
                  </p>
                </div>

                {/* Department filter tabs — filter BOTH columns */}
                <div
                  className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
                  role="tablist"
                  aria-label="Filter issues by department category"
                >
                  {(['All', ...presentCategories] as const).map((cat) => {
                    const isActive = categoryFilter === cat;
                    const count =
                      cat === 'All'
                        ? state.issues.length
                        : state.issues.filter((i) => i.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setCategoryFilter(cat)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-white text-gray-900'
                            : 'border border-[#374151] bg-[#1F2937] text-gray-400 hover:border-gray-500 hover:text-white'
                        }`}
                      >
                        {cat}
                        <span className={`ml-1 ${isActive ? 'text-amber-600' : 'text-gray-600'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  {wardFilter && (
                    <button
                      type="button"
                      onClick={() => setWardFilter(null)}
                      className="ml-1 shrink-0 rounded-full bg-amber-950/60 px-3 py-1.5 text-xs font-bold text-amber-400 ring-1 ring-amber-800 transition-colors hover:bg-amber-900/60"
                    >
                      {wardFilter} ✕
                    </button>
                  )}
                </div>

                {visibleIssues.length === 0 && (
                  <p className="rounded-xl border border-dashed border-[#374151] bg-[#1F2937]/50 p-6 text-center text-sm text-gray-500">
                    No issues match this filter yet — try another department or clear
                    the ward filter.
                  </p>
                )}

                {visibleIssues.map((issue, idx) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    rank={idx + 1}
                    maxPriority={maxPriority}
                    complaints={complaintsByIssue.get(issue.id) ?? []}
                    onGenerateReport={openReport}
                  />
                ))}

                <p className="px-1 text-[11px] leading-relaxed text-gray-600">
                  📥 {state.totalComplaints} raw complaints collapsed into{' '}
                  {state.issues.length} actionable issues — {state.clusterSavings}{' '}
                  duplicates merged by the AI cluster engine · every issue verified
                  two-sided: citizen input de-weighted for manipulation, official
                  records checked against ground reports.
                </p>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-[#374151]/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-gray-600">
          <span>
            CitizenPulse — questions both directions: de-weights manipulated citizen
            input, disputes unfulfilled official records. Not a complaint tracker — a
            closed-loop truth engine.
          </span>
          <span>
            Maharashtra pilot · Nagpur &amp; Mumbai North · Track 1: DPI &amp;
            Governance
          </span>
        </div>
      </footer>

      {reportOpen && liveReportIssue && constituencyId && (
        <ReportDialog
          key={liveReportIssue.id}
          issue={liveReportIssue}
          constituencyId={constituencyId}
          onOpenChange={(o) => {
            if (!o) {
              setReportOpen(false);
              setReportIssue(null);
            }
          }}
        />
      )}
      <SubmitDialog
        open={submitOpen}
        constituencyId={constituencyId}
        onOpenChange={setSubmitOpen}
        onSubmitted={handleSubmitted}
      />
      <InfraDialog open={infraOpen} onOpenChange={setInfraOpen} />
    </div>
  );
}
