import ZAI from 'z-ai-web-dev-sdk';
import {
  CATEGORIES,
  Category,
  Complaint,
  DEPARTMENT_BY_CATEGORY,
  IssueView,
  MpladsRecord,
  Report,
  Urgency,
} from './types';

const LLM_TIMEOUT_CLASSIFY_MS = 45_000;
const LLM_TIMEOUT_REPORT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms),
    ),
  ]);
}

function extractJson(raw: string): Record<string, unknown> | null {
  try {
    const cleaned = raw
      .replace(/```json/gi, '```')
      .split('```')
      .map((s) => s.trim())
      .filter(Boolean);
    const candidates = [...cleaned, raw];
    for (const c of candidates) {
      const start = c.indexOf('{');
      const end = c.lastIndexOf('}');
      if (start === -1 || end <= start) continue;
      try {
        return JSON.parse(c.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        // keep trying
      }
    }
  } catch {
    // fall through
  }
  return null;
}

async function chat(messages: { role: 'system' | 'user'; content: string }[]): Promise<string> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  } as Parameters<typeof zai.chat.completions.create>[0]);
  return completion.choices[0]?.message?.content ?? '';
}

// ─────────────────────────────────────────────────────────────────────────
// Step 1+2 (combined single call): classify a complaint AND match its cluster
// ─────────────────────────────────────────────────────────────────────────

export interface ClassifyResult {
  category: Category;
  urgency: Urgency;
  ward: string;
  location: string;
  language: string;
  translationEn: string;
  summaryEn: string;
  matchedIssueId: string | null;
  aiClassified: boolean;
}

export async function classifyAndMatch(
  text: string,
  existingIssues: { id: string; title: string; category: Category; ward: string }[],
): Promise<ClassifyResult> {
  try {
    const issuesBlock = existingIssues
      .map((i) => `- id:${i.id} | ${i.title} | category:${i.category} | ${i.ward}`)
      .join('\n');

    const system = `You are the complaint intelligence engine of an Indian MP constituency office. A new citizen complaint arrives (any Indian language — Hindi, Tamil, Bengali, Marathi, Hinglish, English, etc.).
Do TWO jobs in one pass:

JOB 1 — CLASSIFY. Return:
- "category": exactly one of [Roads, Water, Sanitation, Electricity, Health, Education, Parks, Safety, Other]
- "urgency": integer 1-5 (5 = immediate danger to life/health e.g. contaminated water, accidents, hospital failures; 4 = serious public harm e.g. large potholes, garbage piling, broken school wall; 3 = significant daily hardship e.g. streetlights out; 2 = nuisance e.g. stray animals; 1 = routine)
- "ward": extract ward like "Ward 12" if mentioned, else "Unknown"
- "location": specific place mentioned, else "Not specified"
- "language": name of the language the complaint is written in
- "translationEn": faithful English translation
- "summary_en": ONE-line neutral English summary (max 12 words)

JOB 2 — CLUSTER MATCH. Compare against the existing issues list. If this complaint is about the SAME underlying problem as an existing issue (same ward/area AND same category of infrastructure problem — different wording, language, or severity still counts as the same issue), set "matched_issue_id" to that id. If it is genuinely a new problem, set it to null.

Return ONLY valid JSON, no prose:
{"category":"...","urgency":N,"ward":"...","location":"...","language":"...","translationEn":"...","summary_en":"...","matched_issue_id":null,"match_reason":"..."}`;

    const user = `EXISTING ISSUES:\n${issuesBlock || '(none yet)'}\n\nNEW COMPLAINT:\n"""${text}"""`;

    const raw = await withTimeout(
      chat([
        { role: 'system', content: system },
        { role: 'user', content: user },
      ]),
      LLM_TIMEOUT_CLASSIFY_MS,
    );
    const parsed = extractJson(raw);
    if (!parsed) throw new Error('Could not parse classification JSON');

    const category = CATEGORIES.includes(parsed.category as Category)
      ? (parsed.category as Category)
      : heuristicClassify(text).category;
    const urgencyNum = Number(parsed.urgency);
    const urgency: Urgency = (
      [1, 2, 3, 4, 5].includes(urgencyNum) ? urgencyNum : 3
    ) as Urgency;
    const matchedId = typeof parsed.matched_issue_id === 'string' ? parsed.matched_issue_id : null;
    const matchedValid =
      matchedId && existingIssues.some((i) => i.id === matchedId) ? matchedId : null;

    return {
      category,
      urgency,
      ward: String(parsed.ward || 'Unknown'),
      location: String(parsed.location || 'Not specified'),
      language: String(parsed.language || 'Unknown'),
      translationEn: String(parsed.translationEn || text),
      summaryEn: String(parsed.summary_en || String(parsed.translationEn || text)).slice(0, 120),
      matchedIssueId: matchedValid,
      aiClassified: true,
    };
  } catch {
    // Fallback: rule-based so the demo NEVER breaks
    const h = heuristicClassify(text);
    return {
      ...h,
      matchedIssueId: null,
      aiClassified: false,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Heuristic fallback classifier (multilingual keyword rules)
// ─────────────────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: { category: Category; words: string[] }[] = [
  { category: 'Roads', words: ['pothole', 'road', 'gadda', 'गड्ढा', 'गड्डे', 'सड़क', 'खड्डे', 'குழி', 'சாலை', 'রাস্তা', 'গর্ত'] },
  { category: 'Water', words: ['water', 'पानी', 'नल', 'कुटिनीर', 'தண்ணீர்', 'நீர்', 'জল', 'pipeline', 'जल'] },
  { category: 'Sanitation', words: ['garbage', 'कचरा', 'नाला', 'ड्रेन', 'waste', 'குப்பை', 'சாக்கடை', 'ময়লা', 'ড্রেন'] },
  { category: 'Electricity', words: ['streetlight', 'light', 'लाइट', 'बत्ती', 'स्ट्रीट लाइट', 'விளக்கு', 'বাতি'] },
  { category: 'Health', words: ['hospital', 'medicine', 'अस्पताल', 'दवा', 'मरुत्तुव', 'மருத்துவமனை', 'மருந்து', 'হাসপাতাল'] },
  { category: 'Education', words: ['school', 'स्कूल', 'स्कूल दीवार', 'विद्यालय', 'பள்ளி', 'স্কুল'] },
  { category: 'Parks', words: ['park', 'swing', 'पार्क', 'झूला', 'பூங்கா', 'পার্ক'] },
  { category: 'Safety', words: ['stray', 'cattle', 'गाय', 'सूअर', 'आवारा', 'மாடு', 'गोवंश'] },
];

const DANGER_WORDS = ['accident', 'गिर', 'पलट', 'घायल', 'hospitalized', 'मौत', 'die', 'death', 'விபத்து', 'காயம்', 'দুর্ঘটনা', 'infection', 'बीमार'];
const SERIOUS_WORDS = ['big', 'बड़ा', 'बहुत', 'massive', 'huge', 'danger', 'खतरा', 'unsafe', 'डर'];

export function heuristicClassify(text: string): Omit<ClassifyResult, 'matchedIssueId' | 'aiClassified'> {
  const t = text.toLowerCase();

  let category: Category = 'Other';
  let best = 0;
  for (const { category: cat, words } of CATEGORY_KEYWORDS) {
    const score = words.filter((w) => t.includes(w.toLowerCase())).length;
    if (score > best) {
      best = score;
      category = cat;
    }
  }

  // Ward extraction: latin + devanagari digits
  const wardMatch =
    t.match(/(?:ward|वार्ड|वॉर्ड|வார்டு)\s*[-:।]?\s*([0-9०-९]{1,2})/i) ??
    t.match(/([0-9०-९]{1,2})\s*(?:ward|वार्ड|वॉर्ड)/i);
  let ward = 'Unknown';
  if (wardMatch) {
    const devanagariDigits = '०१२३४५६७८९';
    const raw = wardMatch[1];
    const latin = [...raw]
      .map((ch) => {
        const idx = devanagariDigits.indexOf(ch);
        return idx >= 0 ? String(idx) : ch;
      })
      .join('');
    ward = `Ward ${latin}`;
  }

  const hasDanger = DANGER_WORDS.some((w) => t.includes(w));
  const hasSerious = SERIOUS_WORDS.some((w) => t.includes(w));
  const urgency: Urgency = hasDanger ? 4 : hasSerious ? 4 : 3;

  // Language detection by script
  let language = 'English';
  if (/[\u0900-\u097F]/.test(text)) {
    language = /खड्डे|आहेत|मध्ये|पूर्ण/.test(text) ? 'Marathi' : 'Hindi';
  } else if (/[\u0B80-\u0BFF]/.test(text)) {
    language = 'Tamil';
  } else if (/[\u0980-\u09FF]/.test(text)) {
    language = 'Bengali';
  } else if (/\b(ka|hai|hain|nahin|kuch|bahut|kar)\b/i.test(t)) {
    language = 'Hinglish';
  }

  return {
    category,
    urgency,
    ward,
    location: 'Not specified',
    language,
    translationEn: text,
    summaryEn: text.slice(0, 100),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Step C: Report generation (summary + action plan + budget + RTI draft)
// ─────────────────────────────────────────────────────────────────────────

export async function generateReport(
  issue: IssueView,
  complaints: Complaint[],
  mplads: MpladsRecord | null,
): Promise<Report> {
  const department = DEPARTMENT_BY_CATEGORY[issue.category];
  const complaintBlock = complaints
    .slice(0, 12)
    .map(
      (c, i) =>
        `${i + 1}. [${c.language}] "${c.translationEn}" — ${c.ward}, via ${c.source}`,
    )
    .join('\n');

  const mpladsBlock = mpladasContextBlock(mplads);

  try {
    const system = `You generate a department action report for an Indian MP constituency office. The MP recommends works under MPLADS (Members of Parliament Local Area Development Scheme); funds are released by the government to the district implementing agency — NEVER say the MP "received" or "spent" money. Use lakh notation (1 lakh = 100,000 INR; 1 crore = 100 lakh).

Return ONLY valid JSON:
{
  "headline": "punchy one-line headline for this issue (max 14 words)",
  "executive_summary": "3-4 sentences: what is happening, scale (N complaints), human impact, current status",
  "action_plan": ["...", "...", "..."] // EXACTLY 3 items, each a concrete, same-day assignable instruction for office staff (name the officer/agency to contact, the document to pull, or the inspection to order)
  "budget": {
    "estimated_cost_lakh": <number>, // CURRENT realistic cost to fully resolve, priced independently — sanctioned works that ran late may need more due to escalation
    "reasoning": "1-2 sentences on how you arrived at the estimate (scale of work, typical rates)"
  },
  "rti_application": "<formal RTI application text under section 6(1) of the RTI Act 2005, addressed to the PIO of the concerned department, demanding fund release/dispatch/physical progress/completion status of the specific sanctioned work. Include subject line and numbered information points. If no sanctioned work exists, return empty string.>"
}
Guidelines: The RTI application is REQUIRED when a sanctioned MPLADS work exists with status Delayed, Ongoing, or Sanctioned–not started (or when the VERIFICATION block marks the completion DISPUTED). If a VERIFICATION block is provided, calibrate the report with it: coordination flags → cautious tone on volume; disputed completion → objective-mismatch framing (never accuse fraud) and the RTI must demand geotagged completion photographs, the utilisation certificate, and any third-party inspection report. Keep all text professional, factual, India-appropriate (use ₹ and lakh).`;

    const user = `ISSUE: "${issue.title}" | Category: ${issue.category} | Ward: ${issue.ward} | Location: ${issue.location} | Complaints: ${complaints.length} (distinct citizens: ${issue.verification.distinctSubmitters}) | Peak urgency: ${issue.urgency}/5

CITIZEN COMPLAINTS (translated to English):
${complaintBlock}

MPLADS CONTEXT:
${mpladsBlock}

VERIFICATION LAYER (two-sided):
${verificationContextBlock(issue)}

Department to address: ${department}`;

    const raw = await withTimeout(
      chat([
        { role: 'system', content: system },
        { role: 'user', content: user },
      ]),
      LLM_TIMEOUT_REPORT_MS,
    );
    const parsed = extractJson(raw);
    if (!parsed) throw new Error('Could not parse report JSON');

    const estimate =
      parsed.budget && typeof parsed.budget === 'object'
        ? Number((parsed.budget as Record<string, unknown>).estimated_cost_lakh)
        : NaN;

    const rti = String(parsed.rti_application ?? '');
    const rtiApplicable =
      (Boolean(mplads) && mplads!.status !== 'Completed') || issue.disputed;

    return {
      issueId: issue.id,
      department,
      headline: String(parsed.headline ?? issue.title),
      executiveSummary: String(parsed.executive_summary ?? ''),
      actionPlan: Array.isArray(parsed.action_plan)
        ? (parsed.action_plan as unknown[]).slice(0, 3).map(String)
        : [],
      budgetEstimateLakh: Number.isFinite(estimate) ? estimate : null,
      budgetReasoning:
        parsed.budget && typeof parsed.budget === 'object'
          ? String((parsed.budget as Record<string, unknown>).reasoning ?? '')
          : '',
      sanctionedLakh: mplads?.amountLakh ?? null,
      shortfallLakh:
        mplads && Number.isFinite(estimate) && (mplads.status !== 'Completed' || issue.disputed)
          ? Math.max(0, Number((estimate - mplads.amountLakh).toFixed(1)))
          : null,
      rtiApplication: rtiApplicable ? rti : '',
      rtiApplicable,
      generatedAt: new Date().toISOString(),
      aiGenerated: true,
    };
  } catch {
    // Deterministic fallback so the "Generate report" flow NEVER fails live
    return fallbackReport(issue, complaints, mplads);
  }
}

function mpladasContextBlock(mplads: MpladsRecord | null): string {
  if (!mplads) {
    return 'NO sanctioned MPLADS work found for this issue — treat as a genuinely new, unfunded problem. The RTI section must be an empty string.';
  }
  const completion = mplads.completionDate
    ? `\n- Officially recorded completion date: ${mplads.completionDate}`
    : '';
  return `A sanctioned MPLADS work MATCHES this issue:
- Work: ${mplads.workName}
- Sanctioned amount: ₹${mplads.amountLakh} lakh on ${mplads.sanctionDate}${completion}
- Status: ${mplads.status}
- Implementing agency: ${mplads.implementingAgency}
Frame accordingly: this is NOT a fresh budget request — it is ${mplads.status === 'Delayed' ? 'a delayed sanctioned work needing follow-up' : mplads.status === 'Completed' ? 'a completed work that has NOT solved the problem — needs escalation and audit' : 'an ongoing sanctioned work needing progress verification'}.`;
}

function verificationContextBlock(issue: IssueView): string {
  const v = issue.verification;
  const lines: string[] = [
    `- Distinct citizens: ${v.distinctSubmitters} of ${issue.count} total reports (priority ranking uses DISTINCT citizens — one citizen, one vote)`,
  ];
  if (v.duplicateSubmitters.length > 0) {
    lines.push(
      `- Duplicate submissions (de-weighted): ${v.duplicateSubmitters
        .map((d) => `${d.name} ×${d.times}`)
        .join(', ')}`,
    );
  }
  if (v.coordinationSuspected) {
    lines.push(
      `- POSSIBLE COORDINATED INPUT: ${v.templatedGroupSize} of ${issue.count} complaints share near-identical templated wording from different submitters (${v.templatedGroupSubmitters.join(', ')}) within a short window. Treat the reported volume with caution — the action plan should include verifying submitter authenticity before treating this as mass demand.`,
    );
  }
  if (issue.disputed) {
    lines.push(
      `- DISPUTED COMPLETION: ${issue.disputeReason} Frame this strictly as an objective mismatch between two data sources (official record vs citizen ground reports) — NEVER as an accusation of fraud; the MP's office decides what to do. The action plan MUST include physical inspection/audit. The RTI application MUST additionally demand: geotagged completion photographs, the utilisation certificate, and any third-party inspection report.`,
    );
  }
  return lines.join('\n');
}

function fallbackReport(
  issue: IssueView,
  complaints: Complaint[],
  mplads: MpladsRecord | null,
): Report {
  const department = DEPARTMENT_BY_CATEGORY[issue.category];
  const estimate = fallbackEstimate(issue);
  const rtiApplicable =
    (Boolean(mplads) && mplads!.status !== 'Completed') || issue.disputed;
  const v = issue.verification;
  const distinctNote =
    v.distinctSubmitters < issue.count
      ? `${v.distinctSubmitters} distinct citizens have reported this (of ${complaints.length} total reports; duplicates de-weighted).`
      : `${complaints.length} distinct citizens have reported this.`;
  const coordinationNote = v.coordinationSuspected
    ? ` Note: ${v.templatedGroupSize} complaints share near-identical templated wording across different submitters — possible coordinated input; volume treated with caution.`
    : '';
  const disputeNote = issue.disputed
    ? ` DISPUTED COMPLETION: ${issue.disputeReason}`
    : '';
  return {
    issueId: issue.id,
    department,
    headline: `${issue.title} — ${v.distinctSubmitters} citizens affected in ${issue.ward}`,
    executiveSummary: `${distinctNote}${coordinationNote}${disputeNote} The issue is rated urgency ${issue.urgency}/5 (verified priority score ${issue.priority}). ${mplads ? `A sanctioned MPLADS work (₹${mplads.amountLakh} lakh, ${mplads.status.toLowerCase()}) already exists against this issue${issue.disputed ? ' and its completion is disputed by ground reports' : ' and must be verified on the ground'}.` : 'No sanctioned MPLADS work is on record for this issue; it requires a fresh budget line.'}`,
    actionPlan: issue.disputed
      ? [
          `Order a joint physical inspection of "${mplads!.workName}" (recorded completed ${mplads!.completionDate}) with ${mplads!.implementingAgency} — the office decides next steps after verifying the mismatch.`,
          `Pull the geotagged completion photographs, utilisation certificate and any third-party inspection report for the ₹${mplads!.amountLakh} lakh work from ${mplads!.implementingAgency}.`,
          `Call the complainants' representative (${complaints[0]?.submittedBy ?? 'lead complainant'}) with findings and an action taken report within 7 days.`,
        ]
      : [
          `Direct ${department} to conduct a site inspection at ${issue.location} within 48 hours and submit a status note.`,
          mplads
            ? `Pull the fund-release and utilisation certificate for "${mplads.workName}" (sanctioned ₹${mplads.amountLakh} lakh, ${mplads.sanctionDate}) from ${mplads.implementingAgency}.`
            : `Request ${department} to prepare a cost estimate and work order proposal for this financial year.`,
          v.coordinationSuspected
            ? `Verify submitter authenticity (phone numbers / OTP logs at intake) before treating the reported volume as mass demand; contact ${v.templatedGroupSubmitters.join(' and ')} directly.`
            : `Call the complainants' representative (${complaints[0]?.submittedBy ?? 'lead complainant'}) with an action taken report within 7 days.`,
        ],
    budgetEstimateLakh: estimate,
    budgetReasoning:
      'Rule-of-thumb estimate based on problem type and ward scale; verify with department estimate.',
    sanctionedLakh: mplads?.amountLakh ?? null,
    shortfallLakh:
      mplads && (mplads.status !== 'Completed' || issue.disputed)
        ? Math.max(0, Number((estimate - mplads.amountLakh).toFixed(1)))
        : null,
    rtiApplication: rtiApplicable ? fallbackRti(issue, mplads!) : '',
    rtiApplicable,
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
  };
}

function fallbackEstimate(issue: IssueView): number {
  const table: Record<string, number> = {
    Roads: 22,
    Water: 20,
    Sanitation: 8,
    Electricity: 6,
    Health: 15,
    Education: 18,
    Parks: 9,
    Safety: 5,
    Other: 10,
  };
  return table[issue.category] ?? 10;
}

function fallbackRti(issue: IssueView, mplads: MpladsRecord): string {
  const items = [
    '1. The date-wise details of funds released against this sanction, including the first and latest instalments.',
    '2. Copies of work orders issued, along with the name of the contractor or executing agency.',
    '3. The physical progress reports and inspection notes filed for this work to date.',
    '4. The utilisation certificate submitted for the funds released so far.',
    '5. The revised completion date of the work and reasons for the delay.',
    `6. Action taken by the department on citizen complaints regarding this work (ref: ${issue.count} complaints, ${issue.ward}).`,
  ];
  if (issue.disputed) {
    items.push(
      '7. Copies of the geotagged completion photographs (with coordinates and timestamps) submitted as proof of completion.',
      '8. The basis on which the work was marked complete — including any third-party inspection or audit report relied upon.',
      '9. The name and designation of the officer who certified physical completion of this work.',
    );
  }
  const completionLine = issue.disputed
    ? `, recorded as completed on ${mplads.completionDate} — a completion status disputed by continuing citizen complaints`
    : `, currently shown as "${mplads.status}"`;
  return `Subject: Application under Section 6(1) of the Right to Information Act, 2005 — Status of MPLADS work "${mplads.workName}"

To,
The Public Information Officer,
${mplads.implementingAgency}

Respected Sir/Madam,

I request the following information regarding the MPLADS work "${mplads.workName}" (ward: ${mplads.ward}), sanctioned for ₹${mplads.amountLakh} lakh on ${mplads.sanctionDate}${completionLine}:

${items.join('\n')}

I request the information within 30 days as mandated under the Act.

Name: ____________
Address: ____________
Date: ____________
Contact: ____________`;
}
