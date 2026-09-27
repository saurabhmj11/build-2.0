import {
  Category,
  Issue,
  MpladsRecord,
  ProfileSource,
  Source,
  SubmitterProfile,
  Urgency,
} from './types';

/**
 * Two-constituency Maharashtra pilot (ARCHITECTURE.md):
 *  - Nagpur  (Vidarbha, semi-urban): roads, borewell water, PHC, agri-market —
 *    fewer & larger MPLADS works, plus the duplicate-filer manipulation cluster.
 *  - Mumbai North (dense metro): waterlogging, garbage, air quality, streetlights —
 *    many smaller works, high volume, and a templated multi-account spam campaign.
 *
 * Seeds are "historical" pre-classified archives (as any office would have);
 * every NEW complaint (live sim / citizen submit) runs the live LLM pipeline.
 * Language texture per the pilot: Marathi + Hindi + English + Hinglish.
 */

interface SeedComplaintSpec {
  id: string;
  issueId: string;
  textOriginal: string;
  language: string;
  translationEn: string;
  summaryEn: string;
  category: Category;
  urgency: Urgency;
  ward: string;
  location: string;
  source: Source;
  submittedBy: string;
  minutesAgo: number;
  /** Module 5 — occupation profile (absent = general citizen) */
  submitterProfile?: SubmitterProfile;
  /** 'declared' at intake or 'inferred' from the text itself */
  profileSource?: ProfileSource;
}

export interface LivePoolItem {
  text: string;
  source: Source;
  submittedBy: string;
}

export interface ConstituencySeed {
  /** mock phone-verified identities — same id = same citizen (ARCHITECTURE.md 4a) */
  submitters: Record<string, string>;
  issues: Omit<Issue, 'complaintIds' | 'createdAt' | 'lastActivityAt'>[];
  complaints: SeedComplaintSpec[];
  mplads: MpladsRecord[];
  livePool: LivePoolItem[];
}

/** MPLADS entitlement: ₹5 crore per MP per year */
export const MPLADS_ENTITLEMENT_LAKH = 500;

// ═══════════════════════════════════════════════════════════════════════════
// NAGPUR — Vidarbha, semi-urban / rural-adjacent
// ═══════════════════════════════════════════════════════════════════════════

const NAGPUR_SUBMITTERS: Record<string, string> = {
  'Pravin Deshmukh': 'PH-90210-4401',
  'Ramesh Gupta': 'PH-90210-4402',
  'Ankit Meshram': 'PH-90210-4403',
  'Mohd. Arif': 'PH-90210-4404',
  'Sunita Kale': 'PH-90210-4405',
  'Yogesh Gadwal': 'PH-90210-4406',
  'Shobha Charate': 'PH-90210-4407',
  'Dinesh Wankhede': 'PH-90210-4408',
  'Bhavna Kale': 'PH-90210-4409',
  'Rajesh Dhoke': 'PH-90210-4410',
  'Vinod Chavhan': 'PH-90210-4411',
  'Nanda Meshram': 'PH-90210-4412',
  'Suresh Bodile': 'PH-90210-4413',
  'Kisan Patil': 'PH-90210-4414',
  'Waman Wanarkar': 'PH-90210-4415',
  'Alok Ranjan': 'PH-90210-4416', // ×3 — manipulation cluster
  'Pankaj Verma': 'PH-90210-4417', // ×2 — manipulation cluster
  // Module 5 — Kalamna mandi farmers (the farmer-weighted cluster)
  'Bapu Madavi': 'PH-90210-4418',
  'Kausalya Ghatol': 'PH-90210-4419',
  // Module 5 — Ward 13 PHC complainants (general citizens)
  'Sadhana Bhoyar': 'PH-90210-4420',
  'Iqbal Mansuri': 'PH-90210-4421',
  'Gajanan Charde': 'PH-90210-4422',
  'Rekha Bagade': 'PH-90210-4423',
};

const NAGPUR_ISSUES: Omit<Issue, 'complaintIds' | 'createdAt' | 'lastActivityAt'>[] = [
  { id: 'ngp-road-12', title: 'Deep potholes on Kamptee Road service lane', category: 'Roads', ward: 'Ward 12', location: 'Kamptee Road service lane, near bus stop', urgency: 5 },
  { id: 'ngp-water-5', title: 'Borewell water supply irregular in Hudkeshwar', category: 'Water', ward: 'Ward 5', location: 'Hudkeshwar & surrounding layouts', urgency: 4 },
  // 4b demo: official record says the Koradi road repair COMPLETED on 10 Jun 2026,
  // yet fresh complaints keep arriving after that date → DISPUTED, not hidden.
  { id: 'ngp-road-8', title: "Koradi internal road broken again after 'completed' repair", category: 'Roads', ward: 'Ward 8', location: 'Koradi internal road, temple stretch', urgency: 4 },
  // Module 5 demo pair — the occupation-weighted flip:
  //   Kalamna mandi road (Roads, 4 distinct FARMERS × urgency 4 = 16 unweighted, ×1.4 → 22.4)
  //   vs Ward 13 PHC (Health, 4 distinct general citizens × urgency 4 = 16, ×1.3 → 20.8).
  // Identical unweighted scores; the farmer cluster ranks ABOVE the PHC because
  // its reporters face a harvest-window deadline. Counterfactual on the card:
  // the same 4 citizens as general reporters → 16 × 1.1 = 17.6 < 20.8 (below the PHC).
  { id: 'ngp-mandi-15', title: 'Kalamna mandi approach road unusable for farm produce', category: 'Roads', ward: 'Ward 15', location: 'Kalamna market committee approach road', urgency: 4 },
  { id: 'ngp-health-13', title: 'Besa PHC (Ward 13) without doctor or medicines for three weeks', category: 'Health', ward: 'Ward 13', location: 'Besa Primary Health Centre, Ward 13', urgency: 4 },
  { id: 'ngp-light-3', title: 'Streetlights out for a fortnight, Ward 3 lanes', category: 'Electricity', ward: 'Ward 3', location: 'Residential lanes, Ward 3', urgency: 3 },
  // 4a demo: 5 reports, only 2 distinct submitters, near-identical templated wording.
  // Raw volume scores 20; verified ranking de-weights duplicates AND quarantines
  // the template group (rank capped at urgency).
  { id: 'ngp-speed-10', title: 'Speed breaker demand outside Sun Shine School', category: 'Roads', ward: 'Ward 10', location: 'Main road outside Sun Shine School', urgency: 4 },
];

const NAGPUR_COMPLAINTS: SeedComplaintSpec[] = [
  // ── Flagship: Kamptee Road potholes, Ward 12 (6 distinct citizens) ──
  {
    id: 'nc-001', issueId: 'ngp-road-12',
    textOriginal: 'वॉर्ड १२ मध्ये कामपठी रोडवर मोठे खड्डे पडले आहेत. आज सकाळी एका मावशीचा स्कूटर घसरला आणि पायाला दुखापत झाली.',
    language: 'Marathi',
    translationEn: 'Huge potholes have formed on Kamptee Road in Ward 12. This morning a lady\'s scooter skidded and she injured her leg.',
    summaryEn: 'Kamptee Road potholes; scooter accident with leg injury this morning',
    category: 'Roads', urgency: 5, ward: 'Ward 12', location: 'Kamptee Road service lane',
    source: 'WhatsApp', submittedBy: 'Pravin Deshmukh', minutesAgo: 290,
  },
  {
    id: 'nc-002', issueId: 'ngp-road-12',
    textOriginal: 'वार्ड 12 कामपठी रोड सर्विस लेन की हालत बहुत खराब है। तीन बड़े गड्ढे हैं, कल स्कूल वैन फिसल गई थी।',
    language: 'Hindi',
    translationEn: 'The Kamptee Road service lane in Ward 12 is in very bad shape. There are three big potholes; a school van skidded yesterday.',
    summaryEn: 'Three big potholes on Kamptee Road; school van skidded yesterday',
    category: 'Roads', urgency: 5, ward: 'Ward 12', location: 'Kamptee Road service lane',
    source: 'Phone', submittedBy: 'Ramesh Gupta', minutesAgo: 245,
  },
  {
    id: 'nc-003', issueId: 'ngp-road-12',
    textOriginal: 'The Kamptee Road service lane in Ward 12 is full of deep potholes. Two-wheelers skid every evening — this needs urgent repair before someone is killed.',
    language: 'English',
    translationEn: 'The Kamptee Road service lane in Ward 12 is full of deep potholes. Two-wheelers skid every evening — this needs urgent repair before someone is killed.',
    summaryEn: 'Deep potholes on Kamptee Road; two-wheelers skidding every evening',
    category: 'Roads', urgency: 5, ward: 'Ward 12', location: 'Kamptee Road service lane, near bus stop',
    source: 'App', submittedBy: 'Ankit Meshram', minutesAgo: 190,
  },
  {
    id: 'nc-004', issueId: 'ngp-road-12',
    textOriginal: 'Kamptee Road service lane Ward 12 me gadde bahut bade hain. Aaj subah ek auto palta, do log chhot lag gaye.',
    language: 'Hinglish',
    translationEn: 'The potholes on the Kamptee Road service lane in Ward 12 are huge. An auto rickshaw overturned this morning and two people were hurt.',
    summaryEn: 'Kamptee Road potholes; auto overturned, two injured this morning',
    category: 'Roads', urgency: 5, ward: 'Ward 12', location: 'Kamptee Road service lane',
    source: 'WhatsApp', submittedBy: 'Mohd. Arif', minutesAgo: 140,
  },
  {
    id: 'nc-005', issueId: 'ngp-road-12',
    textOriginal: 'कामपठी रोडवरील खड्ड्यांमुळे रोज रहदारी अडचणीत येते. रात्री काही दिसत नाही. नगर महापालिका काहीही करत नाही. वॉर्ड १२.',
    language: 'Marathi',
    translationEn: 'Because of the potholes on Kamptee Road, commuters face trouble daily. Nothing is visible at night. The municipal corporation does nothing. Ward 12.',
    summaryEn: 'Daily commuter trouble from Kamptee Road potholes; no action',
    category: 'Roads', urgency: 4, ward: 'Ward 12', location: 'Kamptee Road service lane',
    source: 'Letter', submittedBy: 'Sunita Kale', minutesAgo: 95,
  },
  {
    id: 'nc-006', issueId: 'ngp-road-12',
    textOriginal: 'मैं वार्ड 12 का रहने वाला हूँ। कामपठी रोड के गड्ढों से रोज छोटे हादसे होते हैं, रात में बैरिकेड भी नहीं लगी हैं।',
    language: 'Hindi',
    translationEn: 'I am a Ward 12 resident. The Kamptee Road potholes cause minor accidents daily, and there are not even barricades at night.',
    summaryEn: 'Daily minor accidents on Kamptee Road; no night barricades',
    category: 'Roads', urgency: 4, ward: 'Ward 12', location: 'Kamptee Road service lane',
    source: 'Walk-in', submittedBy: 'Yogesh Gadwal', minutesAgo: 60,
  },

  // ── Borewell water, Ward 5 (4 distinct citizens) ──
  {
    id: 'nc-007', issueId: 'ngp-water-5',
    textOriginal: 'वॉर्ड ५ हुडकेश्वरमध्ये बोअरवेलच्या पाण्याचा पुरवठा आठवड्यापासून बंद आहे. संपूर्ण वसाहत टॅंकरवर अवलंबून आहे.',
    language: 'Marathi',
    translationEn: 'In Hudkeshwar, Ward 5, the borewell water supply has been stopped for a week. The entire layout depends on tankers.',
    summaryEn: 'Borewell supply stopped for a week in Hudkeshwar; layout on tankers',
    category: 'Water', urgency: 4, ward: 'Ward 5', location: 'Hudkeshwar layouts',
    source: 'WhatsApp', submittedBy: 'Shobha Charate', minutesAgo: 620,
  },
  {
    id: 'nc-008', issueId: 'ngp-water-5',
    textOriginal: 'वार्ड 5 में नल का पानी हर दो दिन में आता है, वह भी एक घंटे के लिए। बोअरवेल भी सूख गया है।',
    language: 'Hindi',
    translationEn: 'In Ward 5 tap water comes once in two days, and only for an hour. The borewell has also run dry.',
    summaryEn: 'Tap water once in two days in Ward 5; borewell dry',
    category: 'Water', urgency: 4, ward: 'Ward 5', location: 'Hudkeshwar',
    source: 'Phone', submittedBy: 'Dinesh Wankhede', minutesAgo: 480,
  },
  {
    id: 'nc-009', issueId: 'ngp-water-5',
    textOriginal: 'Water supply in Hudkeshwar (Ward 5) comes once in two days for about an hour. The community borewell has been dry for a week — we are buying bottled water.',
    language: 'English',
    translationEn: 'Water supply in Hudkeshwar (Ward 5) comes once in two days for about an hour. The community borewell has been dry for a week — we are buying bottled water.',
    summaryEn: 'Hour-long supply every two days in Hudkeshwar; borewell dry',
    category: 'Water', urgency: 4, ward: 'Ward 5', location: 'Hudkeshwar layouts',
    source: 'App', submittedBy: 'Bhavna Kale', minutesAgo: 300,
  },
  {
    id: 'nc-010', issueId: 'ngp-water-5',
    textOriginal: 'हुडकेश्वर वॉर्ड ५ मध्ये पाण्यासाठी लोक रोज दोन किलोमीटर पायी जात आहेत. उन्हाळा अजून संपला नाही.',
    language: 'Marathi',
    translationEn: 'In Hudkeshwar Ward 5, people walk two kilometres daily for water. The summer is not over yet.',
    summaryEn: 'Residents walking 2 km daily for water in Hudkeshwar',
    category: 'Water', urgency: 4, ward: 'Ward 5', location: 'Hudkeshwar layouts',
    source: 'Walk-in', submittedBy: 'Rajesh Dhoke', minutesAgo: 210,
  },

  // ── Koradi road — the DISPUTED completion (all complaints AFTER 10 Jun 2026) ──
  {
    id: 'nc-011', issueId: 'ngp-road-8',
    textOriginal: 'The "repaired" internal road in Koradi (Ward 8) is already breaking apart again. Loose gravel everywhere, two bike falls this week near the temple stretch.',
    language: 'English',
    translationEn: 'The "repaired" internal road in Koradi (Ward 8) is already breaking apart again. Loose gravel everywhere, two bike falls this week near the temple stretch.',
    summaryEn: 'Koradi "repaired" road breaking apart again; two bike falls',
    category: 'Roads', urgency: 4, ward: 'Ward 8', location: 'Koradi internal road, temple stretch',
    source: 'WhatsApp', submittedBy: 'Vinod Chavhan', minutesAgo: 36000, // ~25 days ago
  },
  {
    id: 'nc-012', issueId: 'ngp-road-8',
    textOriginal: 'कोराडी गावातील रस्त्याची दुरुस्ती झाली असे सांगितले जाते, पण रस्ता तसाच खराब आहे. वॉर्ड ८.',
    language: 'Marathi',
    translationEn: 'They say the village road in Koradi has been repaired, but the road is just as bad. Ward 8.',
    summaryEn: 'Koradi road still bad despite claimed repair',
    category: 'Roads', urgency: 4, ward: 'Ward 8', location: 'Koradi internal road',
    source: 'Phone', submittedBy: 'Nanda Meshram', minutesAgo: 17280, // ~12 days ago
  },
  {
    id: 'nc-013', issueId: 'ngp-road-8',
    textOriginal: 'वार्ड 8 कोराडी रोड की मरम्मत पूरी हुई थी, लेकिन गड्ढे फिर से आ गए हैं। ऐसा काम कैसे हुआ?',
    language: 'Hindi',
    translationEn: 'The Koradi road repair in Ward 8 was completed, but the potholes are back. How was this work done?',
    summaryEn: 'Koradi road potholes back despite completed repair',
    category: 'Roads', urgency: 4, ward: 'Ward 8', location: 'Koradi internal road',
    source: 'Walk-in', submittedBy: 'Suresh Bodile', minutesAgo: 7200, // ~5 days ago
  },

  // ── Kalamna mandi approach road — the FARMER-weighted cluster (4 distinct farmers) ──
  {
    id: 'nc-014', issueId: 'ngp-mandi-15',
    textOriginal: 'कालमना मंडी का रास्ता कीचड़ से भर गया है। ट्रैक्टर फंस रहे हैं, सब्ज़ी मंडी तक पहुंचानी पड़ती है। वार्ड 15।',
    language: 'Hindi',
    translationEn: 'The Kalamna mandi approach road is full of mud. Tractors are getting stuck; produce has to be carried to the market by hand. Ward 15.',
    summaryEn: 'Kalamna mandi approach road muddy; tractors stuck',
    category: 'Roads', urgency: 3, ward: 'Ward 15', location: 'Kalamna market approach road',
    source: 'Phone', submittedBy: 'Kisan Patil', minutesAgo: 900,
    submitterProfile: 'farmer', profileSource: 'declared',
  },
  {
    id: 'nc-015', issueId: 'ngp-mandi-15',
    textOriginal: 'कळमणा बाजार समितीचा रस्ता खराब असल्याने शेतकऱ्यांना भाजीपाला नेणे कठीण जाते. वॉर्ड १५.',
    language: 'Marathi',
    translationEn: 'Because the Kalamna market committee road is bad, farmers are finding it hard to transport vegetables. Ward 15.',
    summaryEn: 'Farmers struggling to transport produce on Kalamna mandi road',
    category: 'Roads', urgency: 3, ward: 'Ward 15', location: 'Kalamna market approach road',
    source: 'WhatsApp', submittedBy: 'Waman Wanarkar', minutesAgo: 640,
    submitterProfile: 'farmer', profileSource: 'declared',
  },
  // harvest-window texture — urgency 4 lifts the cluster; profile inferred
  // from the text itself (soybean crop waiting, tractor-trolley stuck)
  {
    id: 'nc-023', issueId: 'ngp-mandi-15',
    textOriginal: 'सोयाबीन की फसल कट गई है, लेकिन कालमना मंडी का रस्ता कीचड़ में डूबा है। ट्रैक्टर-ट्रॉली अटकती है, फसल खेत में पड़ी है। वार्ड 15।',
    language: 'Hindi',
    translationEn: 'The soybean crop has been harvested, but the Kalamna mandi road is drowned in mud. Tractor-trolleys keep getting stuck; the crop is lying in the field. Ward 15.',
    summaryEn: 'Harvested soybean stuck in field — mandi road impassable',
    category: 'Roads', urgency: 4, ward: 'Ward 15', location: 'Kalamna market approach road',
    source: 'WhatsApp', submittedBy: 'Bapu Madavi', minutesAgo: 520,
    submitterProfile: 'farmer', profileSource: 'inferred',
  },
  {
    id: 'nc-024', issueId: 'ngp-mandi-15',
    textOriginal: 'आत्ता ऊस तोडणीचा हंगाम आहे, पण कळमणा बाजार समितीच्या रस्त्याने गाड्या जात नाहीत. ऊस बागेतच पडलाय. वॉर्ड १५.',
    language: 'Marathi',
    translationEn: 'It is sugarcane cutting season now, but vehicles cannot use the Kalamna market committee road. The cane is lying in the field itself. Ward 15.',
    summaryEn: 'Sugarcane harvest stuck — market committee road unusable',
    category: 'Roads', urgency: 4, ward: 'Ward 15', location: 'Kalamna market approach road',
    source: 'Phone', submittedBy: 'Kausalya Ghatol', minutesAgo: 300,
    submitterProfile: 'farmer', profileSource: 'inferred',
  },

  // ── Besa PHC Ward 13 — the HEALTH contrast issue (4 distinct general citizens,
  //    same unweighted 16; no MPLADS match → unfunded) ──
  {
    id: 'nc-025', issueId: 'ngp-health-13',
    textOriginal: 'वॉर्ड १३ बेसा आरोग्य केंद्रात तीन आठवड्यांपासून डॉक्टरच नाही. गरोवरीच्या बायकांना शहरात धाडावे लागते.',
    language: 'Marathi',
    translationEn: 'The Besa health centre in Ward 13 has had no doctor for three weeks. Pregnant women are having to be sent to the city.',
    summaryEn: 'Besa PHC without doctor for three weeks; pregnant women referred out',
    category: 'Health', urgency: 4, ward: 'Ward 13', location: 'Besa PHC, Ward 13',
    source: 'WhatsApp', submittedBy: 'Sadhana Bhoyar', minutesAgo: 820,
  },
  {
    id: 'nc-026', issueId: 'ngp-health-13',
    textOriginal: 'वार्ड 13 के स्वास्थ्य केंद्र में तीन हफ्ते से डॉक्टर नहीं आ रहा। दवाइयां भी नहीं मिलतीं।',
    language: 'Hindi',
    translationEn: 'No doctor has been coming to the Ward 13 health centre for three weeks. Medicines are not available either.',
    summaryEn: 'Ward 13 health centre: no doctor for three weeks, no medicines',
    category: 'Health', urgency: 4, ward: 'Ward 13', location: 'Besa PHC, Ward 13',
    source: 'Phone', submittedBy: 'Iqbal Mansuri', minutesAgo: 560,
  },
  {
    id: 'nc-027', issueId: 'ngp-health-13',
    textOriginal: 'The Ward 13 PHC at Besa has had no doctor for three weeks and the medicine cupboard is empty. Fever patients are told to go to the city hospital, 20 km away.',
    language: 'English',
    translationEn: 'The Ward 13 PHC at Besa has had no doctor for three weeks and the medicine cupboard is empty. Fever patients are told to go to the city hospital, 20 km away.',
    summaryEn: 'Besa PHC empty of doctor and medicines; patients sent 20 km',
    category: 'Health', urgency: 4, ward: 'Ward 13', location: 'Besa PHC, Ward 13',
    source: 'App', submittedBy: 'Gajanan Charde', minutesAgo: 410,
  },
  {
    id: 'nc-028', issueId: 'ngp-health-13',
    textOriginal: 'Besa PHC Ward 13 me doctor teen hafte se nahi aa rahe. BP ki goli bhi nahi milti, bukhar walo ko sheher bhejna padta hai.',
    language: 'Hinglish',
    translationEn: 'No doctor has been coming to the Besa PHC in Ward 13 for three weeks. Even BP tablets are unavailable; fever patients have to be sent to the city.',
    summaryEn: 'Besa PHC: no doctor, no BP medicines for three weeks',
    category: 'Health', urgency: 4, ward: 'Ward 13', location: 'Besa PHC, Ward 13',
    source: 'WhatsApp', submittedBy: 'Rekha Bagade', minutesAgo: 150,
  },

  // ── Streetlights, Ward 3 ──
  {
    id: 'nc-016', issueId: 'ngp-light-3',
    textOriginal: 'वॉर्ड ३ मधील गल्लीतील सर्व स्ट्रीटलाइट गेल्या पंधरा दिवसांपासून बंद आहेत. रात्री गल्ली पूर्ण अंधारी असते.',
    language: 'Marathi',
    translationEn: 'All streetlights in our lane in Ward 3 have been off for the last fifteen days. The lane is completely dark at night.',
    summaryEn: 'Streetlights off for fifteen days in Ward 3 lanes',
    category: 'Electricity', urgency: 3, ward: 'Ward 3', location: 'Ward 3 lanes',
    source: 'WhatsApp', submittedBy: 'Shobha Charate', minutesAgo: 450,
  },
  {
    id: 'nc-017', issueId: 'ngp-light-3',
    textOriginal: 'वार्ड 3 की गलियों में लाइटें पंद्रह दिन से बंद हैं। बच्चों को शाम को स्कूल से लौटने में दिक्कत होती है।',
    language: 'Hindi',
    translationEn: 'Lights in the Ward 3 lanes have been off for fifteen days. Children face difficulty returning from school in the evening.',
    summaryEn: 'Ward 3 streetlights off fifteen days; school children affected',
    category: 'Electricity', urgency: 3, ward: 'Ward 3', location: 'Ward 3 lanes',
    source: 'Phone', submittedBy: 'Dinesh Wankhede', minutesAgo: 330,
  },

  // ── Speed-breaker "campaign" — 5 reports, 2 people, templated wording ──
  {
    id: 'nc-018', issueId: 'ngp-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done soon.',
    summaryEn: 'Urgent speed breaker demand outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Alok Ranjan', minutesAgo: 58,
  },
  {
    id: 'nc-019', issueId: 'ngp-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done soon.',
    summaryEn: 'Urgent speed breaker demand outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Alok Ranjan', minutesAgo: 51,
  },
  {
    id: 'nc-020', issueId: 'ngp-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। बस स्टॉप भी पास है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, urgent need for a speed breaker on the main road outside Sun Shine School, Ward 10. Children face accident risk daily. The bus stop is also nearby. Please get it done soon.',
    summaryEn: 'Speed breaker demand outside Sun Shine School — bus stop nearby',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'Phone', submittedBy: 'Alok Ranjan', minutesAgo: 44,
  },
  {
    id: 'nc-021', issueId: 'ngp-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done soon.',
    summaryEn: 'Urgent speed breaker demand outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Pankaj Verma', minutesAgo: 33,
  },
  {
    id: 'nc-022', issueId: 'ngp-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया तुरंत काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done immediately.',
    summaryEn: 'Urgent speed breaker demand outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Pankaj Verma', minutesAgo: 27,
  },
];

const NAGPUR_MPLADS: MpladsRecord[] = [
  {
    id: 'ngp-mpl-01', workName: 'Kamptee Road service lane resurfacing (Ward 12 stretch)',
    ward: 'Ward 12', category: 'Roads', amountLakh: 12,
    sanctionDate: '2026-02-14', status: 'Delayed',
    implementingAgency: 'Nagpur Municipal Corporation — Roads Division',
  },
  {
    id: 'ngp-mpl-02', workName: 'New borewell + distribution pipeline, Hudkeshwar',
    ward: 'Ward 5', category: 'Water', amountLakh: 25,
    sanctionDate: '2025-11-20', status: 'Ongoing',
    implementingAgency: 'Public Health Engineering Dept / NMC Water Works',
  },
  {
    id: 'ngp-mpl-03', workName: 'Koradi internal road repair (temple stretch)',
    ward: 'Ward 8', category: 'Roads', amountLakh: 22,
    sanctionDate: '2025-09-05', completionDate: '2026-06-10', status: 'Completed',
    implementingAgency: 'NMC Roads Division',
  },
  {
    id: 'ngp-mpl-04', workName: 'Primary Health Centre Ward 9 — upgrade incl. medicine storage',
    ward: 'Ward 9', category: 'Health', amountLakh: 28,
    sanctionDate: '2025-12-05', status: 'Delayed',
    implementingAgency: 'District Health Society',
  },
  {
    id: 'ngp-mpl-05', workName: 'LED streetlight retrofit, Ward 3 lanes',
    ward: 'Ward 3', category: 'Electricity', amountLakh: 8,
    sanctionDate: '2026-07-01', status: 'Sanctioned – not started',
    implementingAgency: 'NMC Electrical Division',
  },
];

const NAGPUR_LIVE_POOL: LivePoolItem[] = [
  // pothole cluster grows 6 → 9 (the clustering moment)
  {
    text: 'आज पहाटे कामपठी रोडवर खड्ड्यात ऑटो घसरला, दोन प्रवासी जखमी. वॉर्ड १२.',
    source: 'Phone', submittedBy: 'Bhola Dhoke',
  },
  {
    text: 'वार्ड 12 कामपठी रोड पर गड्ढा अब गड्डे में बदल गया है। बच्चे गिरते रहते हैं, कृपया जल्दी करें।',
    source: 'WhatsApp', submittedBy: 'Anjali Moon',
  },
  {
    text: 'Kamptee Road pe gadde itne bade hain ki aaj ambulance bhi atak gayi thi. Ward 12, please jaldi karo.',
    source: 'Voice note', submittedBy: 'Pappu Shahu',
  },
  // NEW ISSUE — PHC medicines, Ward 9 → mid-demo reveal of the Delayed ₹28L work
  {
    text: 'वॉर्ड ९ च्या प्राथमिक आरोग्य केंद्रात औषधे नाहीत. रक्तदाबाच्या गोळ्याही मिळत नाहीत, बाहेर विकत घ्याव्या लागतात.',
    source: 'WhatsApp', submittedBy: 'Sulochana Bokade',
  },
  {
    text: 'वार्ड 9 स्वास्थ्य केंद्र में दवाइयां नहीं मिल रहीं। बच्चों के टीके के लिए भी दो बार जाना पड़ा।',
    source: 'Phone', submittedBy: 'Imran Sheikh',
  },
  // disputed Koradi completion — "reports since" ticks up live
  {
    text: "Adding to the Koradi road complaints — the 'repaired' stretch near the temple is full of potholes again. Ward 8.",
    source: 'App', submittedBy: 'Sanjay Kalambe',
  },
  // water cluster grows 4 → 5
  {
    text: 'हुडकेश्वरमध्ये आजही पाणी नाही. संपूर्ण वसाहत टाकीकडे बघत बसली आहे. वॉर्ड ५.',
    source: 'WhatsApp', submittedBy: 'Meena Kalambe',
  },
  // mandi grows 4 → 5 (a fifth farmer — inference from "पिकाची … मंडीला";
  // farmer cluster priority visibly ticks up: 22.4 → 28)
  {
    text: 'कालमना मंडी का रास्ता बारिश में और बिगड़ गया। वार्ड 15, कृपया देखें।',
    source: 'WhatsApp', submittedBy: 'Rafiq Qureshi',
  },
  {
    text: 'माझी सोयाबीण पिकाची ट्रॉली आजही कळमण्या मंडीला जाऊ शकली नाही. वॉर्ड १५ चा रस्ता पाहा.',
    source: 'Phone', submittedBy: 'Rahul Khobragade',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MUMBAI NORTH — dense urban metro
// ═══════════════════════════════════════════════════════════════════════════

const MUMBAI_SUBMITTERS: Record<string, string> = {
  'Vaishali Mhatre': 'PH-98201-7711',
  'Rakesh Jadhav': 'PH-98201-7712',
  'Cynthia Dsouza': 'PH-98201-7713',
  'Prakash Bhoir': 'PH-98201-7714',
  'Sandeep Yadav': 'PH-98201-7715',
  'Farida Bootwala': 'PH-98201-7716',
  'Mitesh Lala': 'PH-98201-7717',
  'Alpa Shah': 'PH-98201-7718',
  'Rajesh Mody': 'PH-98201-7719',
  'Kiran Bhatia': 'PH-98201-7720',
  'Deepak Sampat': 'PH-98201-7721',
  'Nikhil Rane': 'PH-98201-7722',
  'Usha Padte': 'PH-98201-7723',
  'Javed Khan': 'PH-98201-7724',
  'Ritu Singh': 'PH-98201-7725',
  'Ganesh More': 'PH-98201-7726',
};

const MUMBAI_ISSUES: Omit<Issue, 'complaintIds' | 'createdAt' | 'lastActivityAt'>[] = [
  // 4b flagship: pre-monsoon desilting marked Completed 28 Jun 2026 — yet the
  // underpass has flooded repeatedly since. DISPUTED, 8 reports and counting.
  { id: 'mum-drain-21', title: 'Waterlogging at SV Road underpass, Malad West', category: 'Drainage', ward: 'Ward 21', location: 'SV Road railway underpass, Malad West', urgency: 5 },
  // The CONTRAST case: vehicle purchased & completed 15 Aug 2026, complaints
  // stopped BEFORE that → verified clean, no dispute flag.
  { id: 'mum-garbage-3', title: 'Garbage pile-up near Dahisar market (resolved on record)', category: 'Sanitation', ward: 'Ward 3', location: 'Dahisar market approach', urgency: 4 },
  { id: 'mum-light-14', title: 'Streetlight outages across Kandivali West lanes', category: 'Electricity', ward: 'Ward 14', location: 'Kandivali West residential lanes', urgency: 3 },
  { id: 'mum-air-27', title: 'Morning smoke from Borivali East industrial belt', category: 'Pollution', ward: 'Ward 27', location: 'Borivali East industrial estate', urgency: 4 },
  // 4a metro variant: 4 near-identical Marathi appeals from 4 DIFFERENT phone
  // ids inside a ~30-minute window → templated campaign, quarantined.
  { id: 'mum-spam-22', title: 'Footpath repair demand, S V Road Malad', category: 'Roads', ward: 'Ward 22', location: 'S V Road footpath, Malad West', urgency: 4 },
];

const MUMBAI_SPAM_TEMPLATE =
  'माननीय, एस.व्ही. रोड मलाड वॉर्ड २२ फुटपाथ लगेच दुरुस्त करावा. पादचाऱ्यांना अतोनात त्रास होतो आहे. कृपया लगेच निधी मंजूर करावे.';

const MUMBAI_COMPLAINTS: SeedComplaintSpec[] = [
  // ── Flagship: SV Road underpass waterlogging, Ward 21 (8 distinct citizens, DISPUTED) ──
  {
    id: 'mc-001', issueId: 'mum-drain-21',
    textOriginal: 'एस.व्ही. रोड अंडरपास, मलाड पश्चिम येथे पावसाचे पाणी साचले आहे. रिक्षांची इंजिने बुडाली. वॉर्ड २१.',
    language: 'Marathi',
    translationEn: 'Rainwater has collected at the SV Road underpass, Malad West. Auto-rickshaw engines got submerged. Ward 21.',
    summaryEn: 'Rainwater logging at SV Road underpass; auto engines submerged',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'WhatsApp', submittedBy: 'Vaishali Mhatre', minutesAgo: 31680, // ~22 days after 28 Jun completion
  },
  {
    id: 'mc-002', issueId: 'mum-drain-21',
    textOriginal: 'वॉर्ड 21 मलाड अंडरपास में हर बारिश में पानी भर जाता है। स्कूल बस को दूसरा रास्ता लेना पड़ता है।',
    language: 'Hindi',
    translationEn: 'The Malad underpass in Ward 21 fills with water every rain. School buses have to take another route.',
    summaryEn: 'Malad underpass floods every rain; school buses diverted',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'Phone', submittedBy: 'Rakesh Jadhav', minutesAgo: 25920,
  },
  {
    id: 'mc-003', issueId: 'mum-drain-21',
    textOriginal: 'The Malad SV Road underpass floods every single rain. Three hours of rain yesterday and it was knee-deep again. Ward 21.',
    language: 'English',
    translationEn: 'The Malad SV Road underpass floods every single rain. Three hours of rain yesterday and it was knee-deep again. Ward 21.',
    summaryEn: 'SV Road underpass knee-deep again after three hours of rain',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'App', submittedBy: 'Cynthia Dsouza', minutesAgo: 21600,
  },
  {
    id: 'mc-004', issueId: 'mum-drain-21',
    textOriginal: 'अंडरपासमध्ये पाणी तासनतास उभे राहते. निचऱ्याचे काहीच झालेले नाही. वॉर्ड २१.',
    language: 'Marathi',
    translationEn: 'Water stands in the underpass for hours. No drainage work has happened at all. Ward 21.',
    summaryEn: 'Water standing for hours in underpass; no drainage done',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'WhatsApp', submittedBy: 'Prakash Bhoir', minutesAgo: 15840,
  },
  {
    id: 'mc-005', issueId: 'mum-drain-21',
    textOriginal: 'Malad underpass phir se bhar gaya. Ward 21. Traffic jam do ghante. Yeh har baar hota hai.',
    language: 'Hinglish',
    translationEn: 'The Malad underpass flooded again. Ward 21. Two hours of traffic jam. This happens every time.',
    summaryEn: 'Malad underpass flooded again; two-hour jam',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'WhatsApp', submittedBy: 'Sandeep Yadav', minutesAgo: 11520,
  },
  {
    id: 'mc-006', issueId: 'mum-drain-21',
    textOriginal: 'मलाड अंडरपास में पानी भरने से ऑटो ड्राइवर सवारियों को पैदल उतारने की स्थिति में हैं। वार्ड 21।',
    language: 'Hindi',
    translationEn: 'With the Malad underpass flooded, auto drivers are having to drop passengers on foot. Ward 21.',
    summaryEn: 'Flooded Malad underpass forcing auto passengers to walk',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'Phone', submittedBy: 'Farida Bootwala', minutesAgo: 8640,
  },
  {
    id: 'mc-007', issueId: 'mum-drain-21',
    textOriginal: 'पावसानंतर अंडरपास बंद करावा लागतो, दरवेळी एकच गोष्ट. वॉर्ड २१.',
    language: 'Marathi',
    translationEn: 'After every rain the underpass has to be closed — the same thing every time. Ward 21.',
    summaryEn: 'Underpass closed after every rain, same story each time',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'Letter', submittedBy: 'Mitesh Lala', minutesAgo: 4320,
  },
  {
    id: 'mc-008', issueId: 'mum-drain-21',
    textOriginal: 'Flooded underpass again this morning — Malad West, SV Road. Office-goers wading through. Ward 21.',
    language: 'English',
    translationEn: 'Flooded underpass again this morning — Malad West, SV Road. Office-goers wading through. Ward 21.',
    summaryEn: 'Office-goers wading through flooded SV Road underpass',
    category: 'Drainage', urgency: 5, ward: 'Ward 21', location: 'SV Road underpass, Malad West',
    source: 'WhatsApp', submittedBy: 'Alpa Shah', minutesAgo: 300,
  },

  // ── Dahisar garbage — complaints all BEFORE the 15 Aug 2026 completion → clean ──
  {
    id: 'mc-009', issueId: 'mum-garbage-3',
    textOriginal: 'वार्ड 3 दहिसर बाजार के पास कचरा दस दिन से नहीं उठाया जा रहा। पूरा इलाका बदबू से भर गया है।',
    language: 'Hindi',
    translationEn: 'Garbage near the Dahisar market in Ward 3 has not been lifted for ten days. The whole area stinks.',
    summaryEn: 'Dahisar market garbage unlifted for ten days; area stinks',
    category: 'Sanitation', urgency: 4, ward: 'Ward 3', location: 'Dahisar market approach',
    source: 'WhatsApp', submittedBy: 'Javed Khan', minutesAgo: 86400, // ~60 days ago — BEFORE completion
  },
  {
    id: 'mc-010', issueId: 'mum-garbage-3',
    textOriginal: 'Garbage near Dahisar market (Ward 3) has not been lifted for over 10 days. Vendors are selling food right next to the pile.',
    language: 'English',
    translationEn: 'Garbage near Dahisar market (Ward 3) has not been lifted for over 10 days. Vendors are selling food right next to the pile.',
    summaryEn: 'Uncollected Dahisar market garbage; food vendors beside pile',
    category: 'Sanitation', urgency: 4, ward: 'Ward 3', location: 'Dahisar market approach',
    source: 'Phone', submittedBy: 'Ritu Singh', minutesAgo: 74880, // ~52 days ago
  },
  {
    id: 'mc-011', issueId: 'mum-garbage-3',
    textOriginal: 'दहिसर बाजारपेठेजवळचा कचरा उचललाच जात नाही. डासांचा त्रास सुरू झाला आहे. वॉर्ड ३.',
    language: 'Marathi',
    translationEn: 'The garbage near Dahisar market just is not being lifted. Mosquito menace has started. Ward 3.',
    summaryEn: 'Dahisar garbage not lifted; mosquito menace started',
    category: 'Sanitation', urgency: 4, ward: 'Ward 3', location: 'Dahisar market approach',
    source: 'Walk-in', submittedBy: 'Ganesh More', minutesAgo: 64800, // ~45 days ago
  },

  // ── Kandivali streetlights, Ward 14 (4 distinct citizens) ──
  {
    id: 'mc-012', issueId: 'mum-light-14',
    textOriginal: 'कांदिवली पश्चिम वॉर्ड १४ मधील गल्ल्यांमधील स्ट्रीटलाइट पूर्ण महिन्यापासून बंद आहेत.',
    language: 'Marathi',
    translationEn: 'The streetlights in the lanes of Kandivali West, Ward 14, have been off for an entire month.',
    summaryEn: 'Kandivali West streetlights off for a month',
    category: 'Electricity', urgency: 3, ward: 'Ward 14', location: 'Kandivali West lanes',
    source: 'WhatsApp', submittedBy: 'Usha Padte', minutesAgo: 700,
  },
  {
    id: 'mc-013', issueId: 'mum-light-14',
    textOriginal: 'Streetlights on our lane in Kandivali West (Ward 14) have been dead for a month. Women avoid walking after 8pm.',
    language: 'English',
    translationEn: 'Streetlights on our lane in Kandivali West (Ward 14) have been dead for a month. Women avoid walking after 8pm.',
    summaryEn: 'Month-long streetlight outage in Kandivali West; unsafe after 8pm',
    category: 'Electricity', urgency: 3, ward: 'Ward 14', location: 'Kandivali West lanes',
    source: 'App', submittedBy: 'Cynthia Dsouza', minutesAgo: 540,
  },
  {
    id: 'mc-014', issueId: 'mum-light-14',
    textOriginal: 'वार्ड 14 कांदिवली की गलियों में लाइटें एक महीने से बंद हैं। रात में स्टेशन तक जाना मुश्किल है।',
    language: 'Hindi',
    translationEn: 'Lights in the Kandivali lanes of Ward 14 have been off for a month. Walking to the station at night is difficult.',
    summaryEn: 'Ward 14 lights off a month; night walk to station difficult',
    category: 'Electricity', urgency: 3, ward: 'Ward 14', location: 'Kandivali West lanes',
    source: 'Phone', submittedBy: 'Rakesh Jadhav', minutesAgo: 380,
  },
  {
    id: 'mc-015', issueId: 'mum-light-14',
    textOriginal: 'Kandivali West streetlights band hain ek mahine se. Ward 14. Raat me office se lautna risky ho gaya hai.',
    language: 'Hinglish',
    translationEn: 'Kandivali West streetlights have been off for a month. Ward 14. Returning from office at night has become risky.',
    summaryEn: 'Risky night commutes with month-long Kandivali outage',
    category: 'Electricity', urgency: 3, ward: 'Ward 14', location: 'Kandivali West lanes',
    source: 'WhatsApp', submittedBy: 'Sandeep Yadav', minutesAgo: 200,
  },

  // ── Borivali East air quality, Ward 27 (3 distinct citizens) ──
  {
    id: 'mc-016', issueId: 'mum-air-27',
    textOriginal: 'बोरिवली पूर्व औद्योगिक वसाहतीतून येणाऱ्या धुरामुळे सकाळी श्वास घेणेही कठीण जाते. वॉर्ड २७.',
    language: 'Marathi',
    translationEn: 'Because of the smoke coming from the Borivali East industrial estate, even breathing is difficult in the mornings. Ward 27.',
    summaryEn: 'Morning smoke from Borivali East estate makes breathing hard',
    category: 'Pollution', urgency: 4, ward: 'Ward 27', location: 'Borivali East industrial estate',
    source: 'WhatsApp', submittedBy: 'Vaishali Mhatre', minutesAgo: 620,
  },
  {
    id: 'mc-017', issueId: 'mum-air-27',
    textOriginal: 'Thick smoke from the Borivali East industrial belt every morning (Ward 27). My son\'s asthma has worsened this month.',
    language: 'English',
    translationEn: 'Thick smoke from the Borivali East industrial belt every morning (Ward 27). My son\'s asthma has worsened this month.',
    summaryEn: 'Daily morning smoke in Ward 27; child asthma worsening',
    category: 'Pollution', urgency: 4, ward: 'Ward 27', location: 'Borivali East industrial estate',
    source: 'App', submittedBy: 'Nikhil Rane', minutesAgo: 430,
  },
  {
    id: 'mc-018', issueId: 'mum-air-27',
    textOriginal: 'वॉर्ड 27 बोरिवली पूर्व के औद्योगिक इलाके से धुआं घुसता है। आंखों में जलन रहती है।',
    language: 'Hindi',
    translationEn: 'Smoke drifts in from the industrial area of Borivali East, Ward 27. Our eyes burn constantly.',
    summaryEn: 'Industrial smoke in Ward 27 causing constant eye irritation',
    category: 'Pollution', urgency: 4, ward: 'Ward 27', location: 'Borivali East industrial estate',
    source: 'Phone', submittedBy: 'Javed Khan', minutesAgo: 260,
  },

  // ── Templated footpath campaign, Ward 22 — 4 "different citizens", identical text ──
  {
    id: 'mc-019', issueId: 'mum-spam-22',
    textOriginal: MUMBAI_SPAM_TEMPLATE,
    language: 'Marathi',
    translationEn: 'Respected Sir, please repair the S V Road Malad (Ward 22) footpath immediately. Pedestrians are suffering greatly. Please sanction funds immediately.',
    summaryEn: 'Templated appeal: repair S V Road Malad footpath immediately',
    category: 'Roads', urgency: 4, ward: 'Ward 22', location: 'S V Road footpath, Malad West',
    source: 'WhatsApp', submittedBy: 'Rajesh Mody', minutesAgo: 38,
  },
  {
    id: 'mc-020', issueId: 'mum-spam-22',
    textOriginal: MUMBAI_SPAM_TEMPLATE,
    language: 'Marathi',
    translationEn: 'Respected Sir, please repair the S V Road Malad (Ward 22) footpath immediately. Pedestrians are suffering greatly. Please sanction funds immediately.',
    summaryEn: 'Templated appeal: repair S V Road Malad footpath immediately',
    category: 'Roads', urgency: 4, ward: 'Ward 22', location: 'S V Road footpath, Malad West',
    source: 'WhatsApp', submittedBy: 'Kiran Bhatia', minutesAgo: 29,
  },
  {
    id: 'mc-021', issueId: 'mum-spam-22',
    textOriginal: MUMBAI_SPAM_TEMPLATE,
    language: 'Marathi',
    translationEn: 'Respected Sir, please repair the S V Road Malad (Ward 22) footpath immediately. Pedestrians are suffering greatly. Please sanction funds immediately.',
    summaryEn: 'Templated appeal: repair S V Road Malad footpath immediately',
    category: 'Roads', urgency: 4, ward: 'Ward 22', location: 'S V Road footpath, Malad West',
    source: 'App', submittedBy: 'Deepak Sampat', minutesAgo: 21,
  },
  {
    id: 'mc-022', issueId: 'mum-spam-22',
    textOriginal: MUMBAI_SPAM_TEMPLATE,
    language: 'Marathi',
    translationEn: 'Respected Sir, please repair the S V Road Malad (Ward 22) footpath immediately. Pedestrians are suffering greatly. Please sanction funds immediately.',
    summaryEn: 'Templated appeal: repair S V Road Malad footpath immediately',
    category: 'Roads', urgency: 4, ward: 'Ward 22', location: 'S V Road footpath, Malad West',
    source: 'WhatsApp', submittedBy: 'Farida Bootwala', minutesAgo: 12,
  },
];

const MUMBAI_MPLADS: MpladsRecord[] = [
  {
    id: 'mum-mpl-01', workName: 'Pre-monsoon desilting of SV Road underpass drains, Malad West',
    ward: 'Ward 21', category: 'Drainage', amountLakh: 12,
    sanctionDate: '2026-04-10', completionDate: '2026-06-28', status: 'Completed',
    implementingAgency: 'BMC Storm Water Drains Department',
  },
  {
    id: 'mum-mpl-02', workName: 'Auto-tipper garbage vehicle, Dahisar market zone',
    ward: 'Ward 3', category: 'Sanitation', amountLakh: 6,
    sanctionDate: '2026-06-01', completionDate: '2026-08-15', status: 'Completed',
    implementingAgency: 'BMC Solid Waste Management Department',
  },
  {
    id: 'mum-mpl-03', workName: 'LED streetlight repairs, Kandivali West lanes',
    ward: 'Ward 14', category: 'Electricity', amountLakh: 9,
    sanctionDate: '2026-05-05', status: 'Ongoing',
    implementingAgency: 'BMC Street Lighting Department',
  },
  {
    id: 'mum-mpl-04', workName: 'Ambient air-quality monitoring stations, Borivali East',
    ward: 'Ward 27', category: 'Pollution', amountLakh: 35,
    sanctionDate: '2026-08-20', status: 'Sanctioned – not started',
    implementingAgency: 'Maharashtra Pollution Control Board',
  },
];

const MUMBAI_LIVE_POOL: LivePoolItem[] = [
  // disputed waterlogging — "reports since completion" keeps climbing
  {
    text: 'मलाड अंडरपास आजही पाण्याखाली. वॉर्ड २१.',
    source: 'Phone', submittedBy: 'Deepak Tandel',
  },
  {
    text: 'वॉर्ड 21 अंडरपास में आज फिर पानी भर गया। ऑफिस टाइम में एक घंटा जाम।',
    source: 'WhatsApp', submittedBy: 'Rehan Qureshi',
  },
  // streetlight cluster grows 4 → 5
  {
    text: 'Kandivali West lane 4 ki lights ab bhi band hain. Ward 14.',
    source: 'WhatsApp', submittedBy: 'Pooja Mistry',
  },
  // air-quality cluster grows 3 → 4
  {
    text: 'आज सकाळी पुन्हा धुराचा थैमान. बोरिवली पूर्व वॉर्ड २७.',
    source: 'WhatsApp', submittedBy: 'Chandrakant Pawar',
  },
  // the campaign keeps pushing — two more identical appeals from fresh accounts
  {
    text: MUMBAI_SPAM_TEMPLATE,
    source: 'WhatsApp', submittedBy: 'Manish Mehta',
  },
  // NEW ISSUE — open manhole, unfunded (shows not everything has a fund record)
  {
    text: 'There is an open manhole with a broken cover on New Link Road near the metro pillar, Ward 18. School kids walk past it every single day.',
    source: 'App', submittedBy: 'Sneha Kadam',
  },
  {
    text: MUMBAI_SPAM_TEMPLATE,
    source: 'WhatsApp', submittedBy: 'Bhavesh Shah',
  },
  // waterlogging again — closing beat
  {
    text: 'Malad underpass closed again due to flooding — third time this month. Ward 21.',
    source: 'App', submittedBy: 'Alok Pandey',
  },
];

// ═══════════════════════════════════════════════════════════════════════════

export const CONSTITUENCY_SEEDS: Record<string, ConstituencySeed> = {
  nagpur: {
    submitters: NAGPUR_SUBMITTERS,
    issues: NAGPUR_ISSUES,
    complaints: NAGPUR_COMPLAINTS,
    mplads: NAGPUR_MPLADS,
    livePool: NAGPUR_LIVE_POOL,
  },
  'mumbai-north': {
    submitters: MUMBAI_SUBMITTERS,
    issues: MUMBAI_ISSUES,
    complaints: MUMBAI_COMPLAINTS,
    mplads: MUMBAI_MPLADS,
    livePool: MUMBAI_LIVE_POOL,
  },
};
