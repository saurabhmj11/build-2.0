import {
  Category,
  Complaint,
  Issue,
  MpladsRecord,
  Source,
  Urgency,
} from './types';

/**
 * Seed data — "historical" complaints received over the last ~3 days.
 * Pre-classified ground truth (as any office archive would be), while every
 * NEW complaint (live feed / citizen submit) runs through the live LLM pipeline.
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
}

export const SEED_ISSUES: Omit<Issue, 'complaintIds' | 'createdAt' | 'lastActivityAt'>[] = [
  { id: 'iss-road-12', title: 'Large potholes on NH-48 service road', category: 'Roads', ward: 'Ward 12', location: 'NH-48 service road, near bus stop', urgency: 4 },
  { id: 'iss-water-5', title: 'Contaminated drinking water supply', category: 'Water', ward: 'Ward 5', location: 'Kalaignar Nagar & surrounding lanes', urgency: 5 },
  { id: 'iss-light-8', title: 'Streetlights out for a month', category: 'Electricity', ward: 'Ward 8', location: 'Residential lanes, Ward 8', urgency: 3 },
  { id: 'iss-garbage-3', title: 'Garbage not lifted near vegetable market', category: 'Sanitation', ward: 'Ward 3', location: 'Sabzi Mandi approach road', urgency: 4 },
  { id: 'iss-drain-5', title: 'Drain overflow entering homes', category: 'Sanitation', ward: 'Ward 5', location: 'Old drainage line, Ward 5', urgency: 5 },
  { id: 'iss-school-7', title: 'Broken school boundary wall', category: 'Education', ward: 'Ward 7', location: 'Govt Primary School, Ward 7', urgency: 4 },
  { id: 'iss-cattle-11', title: 'Stray cattle on main road', category: 'Safety', ward: 'Ward 11', location: 'Main market road, Ward 11', urgency: 2 },
  // Module 4a demo: manipulation cluster — 5 reports, only 2 distinct submitters,
  // near-identical templated wording. Raw volume would score this 20 (top-3);
  // verified ranking scores it 8. Both anti-manipulation checks fire on it.
  { id: 'iss-speed-10', title: 'Speed breaker demand near Sun Shine School', category: 'Roads', ward: 'Ward 10', location: 'Main road outside Sun Shine School, Ward 10', urgency: 4 },
];

/** Mock phone-verified submitter identities (ARCHITECTURE.md 4a):
 *  same id = same verified citizen. Alok Ranjan ×3 and Pankaj Verma ×2
 *  deliberately share ids — they are the manipulation cluster. */
export const SUBMITTER_IDS: Record<string, string> = {
  'Suresh Yadav': 'PH-98201-5112',
  'Ramesh Gupta': 'PH-98201-5113',
  'Meena Patil': 'PH-98201-5114',
  'Arun Kumar': 'PH-98201-5115',
  'Mohd. Irfan': 'PH-98201-5116',
  'S. Banerjee': 'PH-98201-5117',
  'Lakshmi R.': 'PH-98201-5118',
  'Karthik S.': 'PH-98201-5119',
  'Shanti Devi': 'PH-98201-5120',
  'Priya Menon': 'PH-98201-5121',
  'Devendra Singh': 'PH-98201-5122',
  'Neha Sharma': 'PH-98201-5123',
  'Sunil Joshi': 'PH-98201-5124',
  'Ashok Verma': 'PH-98201-5125',
  'Farida B.': 'PH-98201-5126',
  'Kamla Bai': 'PH-98201-5127',
  'R. Das': 'PH-98201-5128',
  'Principal R. Tiwari': 'PH-98201-5129',
  'Vikram Nair': 'PH-98201-5130',
  'Alok Ranjan': 'PH-98201-5131', // ×3 — manipulation cluster
  'Pankaj Verma': 'PH-98201-5132', // ×2 — manipulation cluster
};

export const SEED_COMPLAINTS: SeedComplaintSpec[] = [
  // ── Issue 1: Pothole, Ward 12 (6 complaints — the flagship cluster) ──
  {
    id: 'c-001', issueId: 'iss-road-12',
    textOriginal: 'वार्ड 12 में NH-48 सर्विस रोड पर बहुत बड़े गड्ढे हो गए हैं। रात में दो पहिया वाहन गिर रहे हैं। कृपया जल्दी ठीक कराएं।',
    language: 'Hindi',
    translationEn: 'There are huge potholes on the NH-48 service road in Ward 12. Two-wheelers are skidding at night. Please get it fixed urgently.',
    summaryEn: 'Huge potholes on NH-48 service road, two-wheelers skidding at night',
    category: 'Roads', urgency: 4, ward: 'Ward 12', location: 'NH-48 service road',
    source: 'WhatsApp', submittedBy: 'Suresh Yadav', minutesAgo: 290,
  },
  {
    id: 'c-002', issueId: 'iss-road-12',
    textOriginal: 'Ward 12 service road ka haal kharab hai. Teen bade gadde hain, kal school van giri thi. Bachchon ka school change karna pad raha hai.',
    language: 'Hinglish',
    translationEn: 'The Ward 12 service road is in bad shape. There are three big potholes; a school van overturned yesterday. Parents are being forced to change schools.',
    summaryEn: 'Three big potholes on Ward 12 service road; school van overturned yesterday',
    category: 'Roads', urgency: 5, ward: 'Ward 12', location: 'NH-48 service road',
    source: 'Phone', submittedBy: 'Ramesh Gupta', minutesAgo: 265,
  },
  {
    id: 'c-003', issueId: 'iss-road-12',
    textOriginal: 'वॉर्ड १२ मध्ये सर्व्हिस रोडवर खड्डे पडले आहेत. आजच सकाळी एका मावशीचा स्कूटर घसरला आणि पायाला दुखापत झाली.',
    language: 'Marathi',
    translationEn: 'Potholes have formed on the service road in Ward 12. Just this morning a lady\'s scooter skidded and she injured her leg.',
    summaryEn: 'Potholes on Ward 12 service road; scooter accident with leg injury this morning',
    category: 'Roads', urgency: 4, ward: 'Ward 12', location: 'NH-48 service road',
    source: 'Walk-in', submittedBy: 'Meena Patil', minutesAgo: 240,
  },
  {
    id: 'c-004', issueId: 'iss-road-12',
    textOriginal: 'The service road near Ward 12 bus stop has massive potholes. Two-wheelers skid every single day. This needs urgent repair before someone dies.',
    language: 'English',
    translationEn: 'The service road near Ward 12 bus stop has massive potholes. Two-wheelers skid every single day. This needs urgent repair before someone dies.',
    summaryEn: 'Massive potholes near Ward 12 bus stop, daily two-wheeler skids',
    category: 'Roads', urgency: 4, ward: 'Ward 12', location: 'NH-48 service road, near bus stop',
    source: 'App', submittedBy: 'Arun Kumar', minutesAgo: 180,
  },
  {
    id: 'c-005', issueId: 'iss-road-12',
    textOriginal: 'मैं वार्ड 12 का रहने वाला हूं। सर्विस रोड के गड्ढों की वजह से रोज जाम लगता है और छोटे-छोटे हादसे होते रहते हैं। नगर निगम कुछ नहीं कर रहा।',
    language: 'Hindi',
    translationEn: 'I am a Ward 12 resident. Because of the potholes on the service road there is a jam every day and minor accidents keep happening. The municipal corporation is doing nothing.',
    summaryEn: 'Daily traffic jams and minor accidents due to Ward 12 service road potholes',
    category: 'Roads', urgency: 4, ward: 'Ward 12', location: 'NH-48 service road',
    source: 'Letter', submittedBy: 'Mohd. Irfan', minutesAgo: 150,
  },
  {
    id: 'c-006', issueId: 'iss-road-12',
    textOriginal: 'ওয়ার্ড ১২ সার্ভিস রোডে বিশাল গর্ত। বাসস্ট্যান্ডের কাছে প্রতিদিন দুর্ঘটনা হচ্ছে।',
    language: 'Bengali',
    translationEn: 'Massive potholes on the Ward 12 service road. Accidents are happening daily near the bus stand.',
    summaryEn: 'Massive potholes on Ward 12 service road, daily accidents near bus stand',
    category: 'Roads', urgency: 4, ward: 'Ward 12', location: 'NH-48 service road, near bus stand',
    source: 'WhatsApp', submittedBy: 'S. Banerjee', minutesAgo: 95,
  },

  // ── Issue 2: Water contamination, Ward 5 (4 complaints, urgency 5) ──
  {
    id: 'c-007', issueId: 'iss-water-5',
    textOriginal: 'வார்டு 5-ல் குடிநீரில் அழுக்கு கலந்து வருகிறது. கழிவுநீர் குடிநீருடன் கலந்துவிட்டது. எங்கள் தெருவில் குழந்தைகளுக்கு வயிற்றுப்போக்கு.',
    language: 'Tamil',
    translationEn: 'In Ward 5 the drinking water comes mixed with dirt. Sewage is mixing with the drinking water line. Children in our street have diarrhea.',
    summaryEn: 'Sewage mixing with drinking water in Ward 5; children falling sick',
    category: 'Water', urgency: 5, ward: 'Ward 5', location: 'Kalaignar Nagar',
    source: 'WhatsApp', submittedBy: 'Lakshmi R.', minutesAgo: 320,
  },
  {
    id: 'c-008', issueId: 'iss-water-5',
    textOriginal: 'வார்டு 5, கலைஞர் நகர் 3வது தெருவில் கடந்த வாரம் முதல் தண்ணீர் மஞ்சள் நிறமாக வருகிறது. குடிக்கவே முடியவில்லை.',
    language: 'Tamil',
    translationEn: 'Since last week the water in Ward 5, Kalaignar Nagar 3rd street is coming yellow. It is not even drinkable.',
    summaryEn: 'Yellow, undrinkable tap water in Kalaignar Nagar 3rd street since last week',
    category: 'Water', urgency: 5, ward: 'Ward 5', location: 'Kalaignar Nagar, 3rd street',
    source: 'Phone', submittedBy: 'Karthik S.', minutesAgo: 280,
  },
  {
    id: 'c-009', issueId: 'iss-water-5',
    textOriginal: 'वार्ड 5 में नल के पानी में गंदगी और बदबू आ रही है। कई घरों में लोग बीमार हो रहे हैं। जल्द जांच कराएं।',
    language: 'Hindi',
    translationEn: 'In Ward 5 the tap water has dirt and a foul smell. People in many homes are falling ill. Please get it tested soon.',
    summaryEn: 'Foul-smelling, dirty tap water in Ward 5; residents falling ill',
    category: 'Water', urgency: 5, ward: 'Ward 5', location: 'Ward 5 distribution area',
    source: 'Walk-in', submittedBy: 'Shanti Devi', minutesAgo: 200,
  },
  {
    id: 'c-010', issueId: 'iss-water-5',
    textOriginal: 'Tap water in Ward 5 smells foul and is visibly brown. Three people in my lane are hospitalized with stomach infection. We are buying bottled water to survive.',
    language: 'English',
    translationEn: 'Tap water in Ward 5 smells foul and is visibly brown. Three people in my lane are hospitalized with stomach infection. We are buying bottled water to survive.',
    summaryEn: 'Brown tap water in Ward 5; three hospitalized with stomach infection',
    category: 'Water', urgency: 5, ward: 'Ward 5', location: 'Ward 5 lanes',
    source: 'App', submittedBy: 'Priya Menon', minutesAgo: 120,
  },

  // ── Issue 3: Streetlights, Ward 8 (3 complaints) ──
  {
    id: 'c-011', issueId: 'iss-light-8',
    textOriginal: 'वार्ड 8 की गलियों में स्ट्रीट लाइट एक पूरा महीना से बंद है। रात में अंधेरा रहता है, चोरी की आशंका है।',
    language: 'Hindi',
    translationEn: 'Streetlights in the lanes of Ward 8 have been off for a full month. It stays pitch dark at night and there is a fear of theft.',
    summaryEn: 'Streetlights off for a full month in Ward 8 lanes; fear of theft',
    category: 'Electricity', urgency: 3, ward: 'Ward 8', location: 'Ward 8 lanes',
    source: 'WhatsApp', submittedBy: 'Devendra Singh', minutesAgo: 380,
  },
  {
    id: 'c-012', issueId: 'iss-light-8',
    textOriginal: 'No streetlights working in Ward 8 for the past month. Women feel unsafe walking after 7pm. Complaint to electricity office gave no response.',
    language: 'English',
    translationEn: 'No streetlights working in Ward 8 for the past month. Women feel unsafe walking after 7pm. Complaint to the electricity office got no response.',
    summaryEn: 'Streetlights dead for a month in Ward 8; women unsafe after 7pm',
    category: 'Electricity', urgency: 3, ward: 'Ward 8', location: 'Ward 8 lanes',
    source: 'App', submittedBy: 'Neha Sharma', minutesAgo: 300,
  },
  {
    id: 'c-013', issueId: 'iss-light-8',
    textOriginal: 'वॉर्ड ८ मधील सर्व स्ट्रीटलाइट पूर्ण महिन्यापासून बंद आहेत. मुंबण्यासारखे वातावरण नाही.',
    language: 'Marathi',
    translationEn: 'All streetlights in Ward 8 have been off for an entire month. The situation is unlivable.',
    summaryEn: 'All streetlights in Ward 8 off for an entire month',
    category: 'Electricity', urgency: 3, ward: 'Ward 8', location: 'Ward 8 lanes',
    source: 'Phone', submittedBy: 'Sunil Joshi', minutesAgo: 170,
  },

  // ── Issue 4: Garbage, Ward 3 (2 complaints) ──
  {
    id: 'c-014', issueId: 'iss-garbage-3',
    textOriginal: 'वार्ड 3 सब्जी मंडी के पास कचरा 10 दिन से नहीं उठाया जा रहा। पूरा इलाका बदबू और मच्छरों से भर गया है।',
    language: 'Hindi',
    translationEn: 'Garbage near the Ward 3 vegetable market has not been lifted for 10 days. The whole area is full of stink and mosquitoes.',
    summaryEn: 'Garbage not lifted for 10 days near Ward 3 vegetable market; stink and mosquitoes',
    category: 'Sanitation', urgency: 4, ward: 'Ward 3', location: 'Sabzi Mandi approach road',
    source: 'WhatsApp', submittedBy: 'Ashok Verma', minutesAgo: 350,
  },
  {
    id: 'c-015', issueId: 'iss-garbage-3',
    textOriginal: 'Garbage hasn\'t been collected near the vegetable market in Ward 3 for over 10 days. Huge stink, mosquitoes breeding, vendors selling food right next to it.',
    language: 'English',
    translationEn: 'Garbage hasn\'t been collected near the vegetable market in Ward 3 for over 10 days. Huge stink, mosquitoes breeding, vendors selling food right next to it.',
    summaryEn: 'Uncollected garbage for 10+ days at Ward 3 market; health hazard',
    category: 'Sanitation', urgency: 4, ward: 'Ward 3', location: 'Sabzi Mandi approach road',
    source: 'Phone', submittedBy: 'Farida B.', minutesAgo: 190,
  },

  // ── Issue 5: Drain overflow, Ward 5 (2 complaints) ──
  {
    id: 'c-016', issueId: 'iss-drain-5',
    textOriginal: 'वार्ड 5 में नाला ओवरफ्लो हो रहा है। बारिश में गंदा पानी घरों में घुस गया। ड्रेनेज सिस्टम पूरी तरह बंद है।',
    language: 'Hindi',
    translationEn: 'The drain is overflowing in Ward 5. During rain, dirty water entered homes. The drainage system is completely blocked.',
    summaryEn: 'Drain overflow in Ward 5; dirty water entering homes during rain',
    category: 'Sanitation', urgency: 5, ward: 'Ward 5', location: 'Old drainage line, Ward 5',
    source: 'WhatsApp', submittedBy: 'Kamla Bai', minutesAgo: 260,
  },
  {
    id: 'c-017', issueId: 'iss-drain-5',
    textOriginal: 'ওয়ার্ড ৫ এ ড্রেন উপচে পড়ছে, বৃষ্টিতে নোংরা পানি ঢুকে পড়ছে বাড়িতে। কয়েকদিন ধরে কেউ সাড়া দিচ্ছে না।',
    language: 'Bengali',
    translationEn: 'The drain is overflowing in Ward 5; dirty water is entering homes when it rains. No one has responded for several days.',
    summaryEn: 'Overflowing drain in Ward 5, rainwater flooding homes, no response',
    category: 'Sanitation', urgency: 5, ward: 'Ward 5', location: 'Old drainage line, Ward 5',
    source: 'Phone', submittedBy: 'R. Das', minutesAgo: 130,
  },

  // ── Issue 6: School wall, Ward 7 (1 complaint) ──
  {
    id: 'c-018', issueId: 'iss-school-7',
    textOriginal: 'वार्ड 7 सरकारी प्राथमिक स्कूल की दीवार टूट गई है। बच्चे खुले हिस्से से सीधे सड़क पर निकल जाते हैं, हादसे का खतरा है।',
    language: 'Hindi',
    translationEn: 'The boundary wall of the government primary school in Ward 7 has collapsed. Children walk straight onto the road through the open section — risk of accidents.',
    summaryEn: 'Collapsed school boundary wall in Ward 7; children exposed to road',
    category: 'Education', urgency: 4, ward: 'Ward 7', location: 'Govt Primary School, Ward 7',
    source: 'Letter', submittedBy: 'Principal R. Tiwari', minutesAgo: 420,
  },

  // ── Issue 7: Stray cattle, Ward 11 (1 complaint) ──
  {
    id: 'c-019', issueId: 'iss-cattle-11',
    textOriginal: 'Stray cattle block the main road near Ward 11 market every evening. Traffic jams daily and one bike accident last week.',
    language: 'English',
    translationEn: 'Stray cattle block the main road near the Ward 11 market every evening. Daily traffic jams and one bike accident last week.',
    summaryEn: 'Stray cattle blocking Ward 11 main road evenings; daily jams, one accident',
    category: 'Safety', urgency: 2, ward: 'Ward 11', location: 'Main market road, Ward 11',
    source: 'App', submittedBy: 'Vikram Nair', minutesAgo: 460,
  },

  // ── Issue 8: Speed breaker "campaign", Ward 10 (5 reports, 2 people, templated) ──
  {
    id: 'c-020', issueId: 'iss-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done soon.',
    summaryEn: 'Urgent demand: speed breaker outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Alok Ranjan', minutesAgo: 58,
  },
  {
    id: 'c-021', issueId: 'iss-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done soon.',
    summaryEn: 'Urgent demand: speed breaker outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Alok Ranjan', minutesAgo: 51,
  },
  {
    id: 'c-022', issueId: 'iss-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। बस स्टॉप भी पास है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, urgent need for a speed breaker on the main road outside Sun Shine School, Ward 10. Children face accident risk daily. The bus stop is also nearby. Please get it done soon.',
    summaryEn: 'Speed breaker demand outside Sun Shine School — bus stop nearby',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'Phone', submittedBy: 'Alok Ranjan', minutesAgo: 44,
  },
  {
    id: 'c-023', issueId: 'iss-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया जल्द काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done soon.',
    summaryEn: 'Urgent demand: speed breaker outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Pankaj Verma', minutesAgo: 33,
  },
  {
    id: 'c-024', issueId: 'iss-speed-10',
    textOriginal: 'माननीय साहब, वार्ड 10 सन शाइन स्कूल के बाहर मेन रोड पर स्पीड ब्रेकर बनवाने की तुरंत जरूरत है। रोज़ बच्चों का हादसा होने का खतरा है। कृपया तुरंत काम कराएं।',
    language: 'Hindi',
    translationEn: 'Respected Sir, there is an urgent need to build a speed breaker on the main road outside Sun Shine School in Ward 10. Children face accident risk daily. Please get the work done immediately.',
    summaryEn: 'Urgent demand: speed breaker outside Sun Shine School, Ward 10',
    category: 'Roads', urgency: 4, ward: 'Ward 10', location: 'Main road outside Sun Shine School',
    source: 'WhatsApp', submittedBy: 'Pankaj Verma', minutesAgo: 27,
  },
];

/**
 * MPLADS works recommended by the MP for this constituency.
 * Framing (accurate per PRD): the MP recommends works; funds are released by
 * the government to the district implementing agency. These records verify
 * what was sanctioned and its completion status.
 */
export const MPLADS_RECORDS: MpladsRecord[] = [
  {
    id: 'mpl-01', workName: 'Repair of NH-48 service road (Ward 12 stretch)',
    ward: 'Ward 12', category: 'Roads', amountLakh: 18,
    sanctionDate: '2025-03-14', status: 'Delayed',
    implementingAgency: 'Municipal Corporation – Roads Division',
  },
  {
    id: 'mpl-02', workName: 'Replacement of old drinking water pipeline – Kalaignar Nagar',
    ward: 'Ward 5', category: 'Water', amountLakh: 45,
    sanctionDate: '2025-01-20', status: 'Ongoing',
    implementingAgency: 'Public Health Engineering Dept',
  },
  {
    id: 'mpl-03', workName: 'Purchase of garbage collection vehicle for Ward 3 market zone',
    ward: 'Ward 3', category: 'Sanitation', amountLakh: 6,
    sanctionDate: '2024-11-02', completionDate: '2025-02-20', status: 'Completed',
    implementingAgency: 'Municipal Sanitation Department',
  },
  {
    id: 'mpl-04', workName: 'Community hall construction, Ward 6',
    ward: 'Ward 6', category: 'Other', amountLakh: 9,
    sanctionDate: '2024-08-15', completionDate: '2025-01-10', status: 'Completed',
    implementingAgency: 'Municipal Corporation',
  },
  {
    id: 'mpl-05', workName: 'Govt Primary School Ward 7 – building renovation incl. boundary wall',
    ward: 'Ward 7', category: 'Education', amountLakh: 32,
    sanctionDate: '2025-02-10', status: 'Ongoing',
    implementingAgency: 'District Education Department / PWD',
  },
  {
    id: 'mpl-06', workName: 'Primary Health Centre Ward 9 – upgrade incl. medicine storage',
    ward: 'Ward 9', category: 'Health', amountLakh: 28,
    sanctionDate: '2024-12-05', status: 'Delayed',
    implementingAgency: 'District Health Society',
  },
  {
    id: 'mpl-07', workName: 'Children\'s park development, Ward 2',
    ward: 'Ward 2', category: 'Parks', amountLakh: 15,
    sanctionDate: '2025-04-01', status: 'Ongoing',
    implementingAgency: 'Horticulture & Parks Department',
  },
  {
    id: 'mpl-08', workName: 'Stray animal shelter (cattle pond), Ward 11',
    ward: 'Ward 11', category: 'Safety', amountLakh: 5,
    sanctionDate: '2025-05-22', status: 'Sanctioned – not started',
    implementingAgency: 'Municipal Corporation',
  },
];

/** MPLADS entitlement: ₹5 crore per MP per year */
export const MPLADS_ENTITLEMENT_LAKH = 500;

/**
 * Live-feed pool — streamed in one at a time by the demo simulation.
 * These run through the REAL LLM pipeline (classify + cluster match).
 */
export interface LivePoolItem {
  text: string;
  source: Source;
  submittedBy: string;
}

export const LIVE_POOL: LivePoolItem[] = [
  // 4 more pothole complaints → cluster grows 6 → 10 (the clustering moment)
  {
    text: 'आज सुबह वार्ड 12 में साइकिल दुकान के पास गड्ढे में ऑटो पलट गया, दो यात्री घायल हुए। ये सड़क बहुत खतरनाक हो गई है।',
    source: 'Phone', submittedBy: 'Bhola Yadav',
  },
  {
    text: 'Adding to the Ward 12 complaints — the pothole near the bus stop has now become a crater. I almost fell with my child today.',
    source: 'WhatsApp', submittedBy: 'Anjali M.',
  },
  {
    text: 'வார்டு 12 சர்வீஸ் ரோட்டில் பெரிய குழிகள். இன்று காலை ஒரு ஆட்டோ கவிழ்ந்தது, இரண்டு பேர் காயம்.',
    source: 'WhatsApp', submittedBy: 'M. Selvam',
  },
  {
    text: 'गड्ढे वाली जगह पर अब बोर्ड या बैरिकेड लगाना जरूरी है वार्ड 12 में। रात में किसी को कुछ दिखता नहीं।',
    source: 'Voice note', submittedBy: 'Pappu Singh',
  },
  // 2 more water complaints → 6
  {
    text: 'வார்டு 5-ல் இன்றும் அசுத்தமான தண்ணீர் தான். மருத்துவமனையில் 5 பேர் அனுமதிக்கப்பட்டுள்ளனர்.',
    source: 'Phone', submittedBy: 'Dr. Kavitha',
  },
  {
    text: 'वार्ड 5 का पानी और खराब हो गया है, अब तो नाले का पानी मिल रहा है। बच्चे बीमार हो रहे हैं।',
    source: 'WhatsApp', submittedBy: 'Rekha Devi',
  },
  // NEW ISSUE: hospital medicines, Ward 9 → matches a DELAYED ₹28L sanctioned work
  {
    text: 'வார்டு 9 அரசு மருத்துவமனையில் காசுவாசம் மருந்துகள் இல்லை. ரத்த அழுத்த மாத்திரைகள் கிடைப்பதில்லை, வெளியே வாங்க வேண்டிய நிலை.',
    source: 'WhatsApp', submittedBy: 'A. Rajendran',
  },
  // 1 more garbage → 3
  {
    text: 'मंडी के पास कचरा अब ढेर सा लग गया है वार्ड 3 में। सूअर घूमने लगे हैं, हालात बहुत खराब हैं।',
    source: 'Walk-in', submittedBy: 'Javed Khan',
  },
  // 1 more streetlight → 4
  {
    text: 'वार्ड 8 में तीसरा हफ्ता चल गया, लाइट अब भी बंद। बुजुर्गों को रात में बाहर निकलने में बहुत तकलीफ होती है।',
    source: 'WhatsApp', submittedBy: 'Hari Prasad',
  },
  // NEW ISSUE: park swings, Ward 2 → matches an ONGOING ₹15L sanctioned work
  {
    text: 'The children\'s park in Ward 2 has broken swings and a rusted slide. Kids keep getting minor cuts playing there.',
    source: 'App', submittedBy: 'Sunita R.',
  },
];
