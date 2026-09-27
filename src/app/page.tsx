'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, Inbox, ListFilter } from 'lucide-react';
import { Header } from '@/components/cp/header';
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

export default function Home() {
  const { toast } = useToast();
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

  const setProcessingBoth = useCallback((v: boolean) => {
    processingRef.current = v;
    setProcessing(v);
  }, []);

  // Initial load
  useEffect(() => {
    fetch('/api/state')
      .then((r) => r.json())
      .then((d: DashboardState) => setState(d))
      .catch(() => toast({ title: 'Failed to load dashboard' }));
  }, []);

  // Background refresh (cheap — in-memory store)
  useEffect(() => {
    const iv = setInterval(() => {
      if (document.hidden || processingRef.current) return;
      fetch('/api/state')
        .then((r) => r.json())
        .then((d: DashboardState) => setState(d))
        .catch(() => undefined);
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  // Live feed simulation — client-paced
  useEffect(() => {
    if (!liveOn) return;
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
        const res = await fetch('/api/demo/next', { method: 'POST' });
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
              description: `${issue.count} citizens have now reported this · priority ${issue.priority} · watch the rank move up`,
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
  }, [liveOn, setProcessingBoth, toast]);

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
    setLiveOn(false);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setState(data.state as DashboardState);
        toast({ title: 'Demo reset', description: 'Back to the seeded intake of 24 complaints.' });
      }
    } catch {
      toast({ title: 'Reset failed' });
    }
  }, [toast]);

  const handleSubmitted = useCallback(
    (newState: DashboardState, summary: string, isNewIssue: boolean) => {
      setState(newState);
      toast({
        title: isNewIssue ? 'Complaint registered — new issue opened' : 'Complaint registered — merged into existing issue',
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header
        liveOn={liveOn}
        onToggleLive={setLiveOn}
        onSubmitClick={() => setSubmitOpen(true)}
        onReset={handleReset}
        onInfraClick={() => setInfraOpen(true)}
        totalComplaints={state?.totalComplaints ?? 0}
        totalIssues={state?.issues.length ?? 0}
        aiCount={state?.aiClassifiedCount ?? 0}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:py-6">
        {!state ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(330px,390px)_1fr]">
              <Skeleton className="h-[480px] rounded-xl" />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <FundStrip
              fund={state.fundSummary}
              totalComplaints={state.totalComplaints}
              totalIssues={state.issues.length}
            />
            <VerificationStrip summary={state.verificationSummary} />

            <WardMap
              stats={state.wardStats}
              selected={wardFilter}
              onSelect={setWardFilter}
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(330px,390px)_1fr]">
              <LiveFeed complaints={state.complaints.slice(0, 40)} processing={processing} />

              <section aria-label="Ranked priority issues" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ListFilter className="h-4 w-4 text-slate-500" aria-hidden />
                    Ranked issues
                  </h2>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <ArrowDownUp className="h-3 w-3" aria-hidden />
                    sorted by distinct citizens × urgency — one citizen, one vote
                    {state.livePoolRemaining > 0 && (
                      <span className="ml-1 rounded-full bg-white px-2 py-0.5 font-semibold text-slate-500 shadow-sm">
                        {state.livePoolRemaining} in sim queue
                      </span>
                    )}
                  </p>
                </div>

                {/* Department filter tabs (ARCHITECTURE.md UI layer) */}
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
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                        <span
                          className={`ml-1 ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  {wardFilter && (
                    <button
                      type="button"
                      onClick={() => setWardFilter(null)}
                      className="ml-1 shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
                    >
                      {wardFilter} ✕
                    </button>
                  )}
                </div>

                {visibleIssues.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
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

                <p className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
                  <Inbox className="h-3 w-3 shrink-0" aria-hidden />
                  {state.totalComplaints} raw complaints collapsed into{' '}
                  {state.issues.length} actionable issues — {state.clusterSavings}{' '}
                  duplicates merged by the AI cluster engine · every issue
                  verified two-sided: citizen input de-weighted for manipulation,
                  official records checked against ground reports.
                </p>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-slate-400">
          <span>
            CitizenPulse — questions both directions: de-weights manipulated
            citizen input, disputes unfulfilled official records. Not a
            complaint tracker — a closed-loop truth engine.
          </span>
          <span>Track 1: AI for Digital Public Infrastructure &amp; Governance · MVP demo</span>
        </div>
      </footer>

      {reportOpen && liveReportIssue && (
        <ReportDialog
          key={liveReportIssue.id}
          issue={liveReportIssue}
          onOpenChange={(o) => {
            if (!o) {
              setReportOpen(false);
              setReportIssue(null);
            }
          }}
        />
      )}
      <SubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} onSubmitted={handleSubmitted} />
      <InfraDialog open={infraOpen} onOpenChange={setInfraOpen} />
    </div>
  );
}
