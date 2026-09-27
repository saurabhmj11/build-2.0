import { Category, SubmitterProfile } from './types';

/**
 * Module 5 — Occupation-aware priority weighting.
 *
 * Rationale (why this is defensible, not arbitrary): urgency WINDOWS differ
 * by occupation. A farmer's road complaint is tied to a hard seasonal
 * deadline — harvest must reach the mandi before it rots; every day of road
 * damage is income lost. Most health or school complaints, while serious,
 * are not time-boxed the same way. So the scoring reflects urgency windows,
 * not "farmers care about roads because farming".
 *
 * This is a multiplier on the existing verified score — a small, explainable
 * addition to the ranking, not a new module:
 *
 *   priority = distinct citizens × urgency × category_weight[profile][category]
 *
 * Dominant profile of an issue's DISTINCT reporters decides which weight
 * table applies (strict majority: farmers > general citizens).
 */

/** Per-category priority multipliers by submitter profile. Unlisted = 1.0. */
export const CATEGORY_WEIGHTS: Record<SubmitterProfile, Partial<Record<Category, number>>> = {
  // Default (general citizen): life-safety categories lead.
  general: { Health: 1.3, Roads: 1.1, Education: 1.0 },
  // Farmer: road/transport damage in a harvest window costs income daily.
  farmer: { Roads: 1.4, Health: 1.1, Education: 0.9 },
};

export function categoryWeight(profile: SubmitterProfile, category: Category): number {
  return CATEGORY_WEIGHTS[profile][category] ?? 1.0;
}

/** Human-readable reason for the applied weight (report + tooltip copy). */
export function weightRationale(
  profile: SubmitterProfile,
  category: Category,
): string {
  if (profile === 'farmer') {
    if (category === 'Roads') {
      return 'Road damage in a harvest window blocks crop transport to the mandi — a hard seasonal deadline that costs income daily.';
    }
    if (category === 'Health') {
      return 'Health stays high for farmers (family and labour availability during sowing/harvest), just below the harvest-window road weight.';
    }
    if (category === 'Education') {
      return 'Education is tracked but weighted lower unless the complaint explicitly ties to child dropout during farm-labour season.';
    }
  }
  if (profile === 'general' && category === 'Health') {
    return 'Life-safety carries the highest default weight for the general public.';
  }
  return 'Neutral weight for this profile and category.';
}

/**
 * Multilingual farmer signal words — crops, mandi, tractors, harvest, fields.
 * Deliberately SPECIFIC: generic words like "market" or "road" alone never
 * infer a farming livelihood.
 */
const FARMER_SIGNAL_WORDS: string[] = [
  // English / Hinglish
  'my crop', 'harvest', 'mandi', 'tractor', 'my field', 'farm produce',
  'sugarcane', 'soybean', 'cotton crop', 'kharif', 'rabi',
  // Hindi (Devanagari)
  'फसल', 'मंडी', 'ट्रैक्टर', 'खेत', 'किसान', 'पैदावार', 'ट्रॉली', 'गन्ना',
  'सोयाबीन', 'कपास',
  // Marathi (Devanagari)
  'शेतकर', 'शेतात', 'पिके', 'पिका', 'पिकां', 'ऊस', 'बागेत', 'बाजार समिती',
  'खरीप', 'रब्बी', 'गहू',
];

/** True when the complaint text itself signals a farming livelihood. */
export function inferFarmerFromText(text: string): boolean {
  const t = text.toLowerCase();
  return FARMER_SIGNAL_WORDS.some((w) => t.includes(w.toLowerCase()));
}
