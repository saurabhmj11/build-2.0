/**
 * Module 5 assertions — occupation-weighted ranking.
 * Run: bun /home/z/my-project/scripts/verify-module5.ts
 */
import { getDashboardState, resetStore } from '../src/lib/store';
import { inferFarmerFromText } from '../src/lib/profile';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`✗ ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else {
    console.log(`✓ ${name} = ${JSON.stringify(actual)}`);
  }
}

// ── Signal-word inference (the texts that must / must not trigger) ──
check('infer: soybean harvest Hindi (nc-023)', inferFarmerFromText('सोयाबीन की फसल कट गई है, लेकिन कालमना मंडी का रस्ता कीचड़ में डूबा है।'), true);
check('infer: sugarcane Marathi (nc-024)', inferFarmerFromText('आत्ता ऊस तोडणीचा हंगाम आहे, पण कळमणा बाजार समितीच्या रस्त्याने गाड्या जात नाहीत.'), true);
check('infer: pool soybean trolley Marathi', inferFarmerFromText('माझी सोयाबीण पिकाची ट्रॉली आजही कळमण्या मंडीला जाऊ शकली नाही. वॉर्ड १५ चा रस्ता पाहा.'), true);
check('infer: market vendor NOT farmer', inferFarmerFromText('Dahisar market ke paas kachra jama hai, ward 3.'), false);
check('infer: picnic guard', inferFarmerFromText('पिकनिक स्पॉट जवळ पाण्याची टाकी तुटली आहे.'), false);
check('infer: pothole complaint NOT farmer', inferFarmerFromText('Kamptee Road pe gadde itne bade hain ki ambulance bhi atak gayi thi.'), false);

// ── Nagpur at load ──
resetStore('nagpur');
const ngp = getDashboardState('nagpur');
const byId = new Map(ngp.issues.map((i) => [i.id, i]));

const kamptee = byId.get('ngp-road-12')!;
const mandi = byId.get('ngp-mandi-15')!;
const health13 = byId.get('ngp-health-13')!;
const water = byId.get('ngp-water-5')!;
const koradi = byId.get('ngp-road-8')!;
const lights = byId.get('ngp-light-3')!;
const speed = byId.get('ngp-speed-10')!;

check('Kamptee priority (6 distinct × 5 × 1.1 general Roads)', kamptee.priority, 33);
check('Kamptee profile general', kamptee.profile, 'general');

check('Mandi farmerCount', mandi.farmerCount, 4);
check('Mandi generalCount', mandi.generalCount, 0);
check('Mandi profile farmer', mandi.profile, 'farmer');
check('Mandi priority (4 farmers × 4 × 1.4)', mandi.priority, 22.4);
check('Mandi unweightedPriority', mandi.unweightedPriority, 16);
check('Mandi counterfactual as general (16 × 1.1)', Math.round(mandi.unweightedPriority * 1.1 * 10) / 10, 17.6);

check('Health13 priority (4 general × 4 × 1.3)', health13.priority, 20.8);
check('Health13 profile general', health13.profile, 'general');
check('Health13 no MPLADS (unfunded)', health13.mplads, null);

check('Water priority unchanged (4 × 4 × 1.0)', water.priority, 16);
check('Koradi priority (3 × 4 × 1.1)', koradi.priority, 13.2);
check('Streetlights priority (2 × 3 × 1.0)', lights.priority, 6);
check('Speed-breaker quarantined (1 × 4 × 1.1)', speed.priority, 4.4);
check('Speed-breaker rawPriority', speed.rawPriority, 20);

// The flip: farmer road ABOVE health, counterfactual BELOW health
const order = ngp.issues.map((i) => i.id);
check('Mandi ranks above Health13', order.indexOf('ngp-mandi-15') < order.indexOf('ngp-health-13'), true);
check('Rank order #1..#3', order.slice(0, 3), ['ngp-road-12', 'ngp-mandi-15', 'ngp-health-13']);
check('verificationSummary.farmerWeighted', ngp.verificationSummary.farmerWeighted, 1);

// Farmers in the complaint feed carry the badge data
const farmerComplaints = ngp.complaints.filter((c) => c.submitterProfile === 'farmer');
check('Nagpur farmer complaints', farmerComplaints.length, 4);
check('Declared vs inferred split', [
  farmerComplaints.filter((c) => c.profileSource === 'declared').length,
  farmerComplaints.filter((c) => c.profileSource === 'inferred').length,
], [2, 2]);

// Ward 13 present in ward stats (map renders it)
check('Ward 13 in wardStats', ngp.wardStats.some((w) => w.ward === 'Ward 13'), true);

// ── Mumbai North: occupation weighting must be a NO-OP (metro, all general) ──
resetStore('mumbai-north');
const mum = getDashboardState('mumbai-north');
const expectedMumbai: Record<string, number> = {
  'mum-drain-21': 40, // 8 × 5 × 1.0
  'mum-garbage-3': 12, // 3 × 4 × 1.0
  'mum-light-14': 12, // 4 × 3 × 1.0
  'mum-air-27': 12, // 3 × 4 × 1.0
  'mum-spam-22': 4.4, // quarantined 1 × 4 × 1.1 (Roads)
};
for (const [id, p] of Object.entries(expectedMumbai)) {
  const iv = mum.issues.find((i) => i.id === id)!;
  check(`Mumbai ${id} priority`, iv.priority, p);
}
check('Mumbai farmer-weighted count', mum.verificationSummary.farmerWeighted, 0);
check('Mumbai zero farmer complaints', mum.complaints.filter((c) => c.submitterProfile === 'farmer').length, 0);

console.log(failures === 0 ? '\nALL MODULE-5 ASSERTIONS PASSED' : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
