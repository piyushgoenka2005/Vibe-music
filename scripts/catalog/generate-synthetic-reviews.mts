/**
 * Generate realistic synthetic Indian product reviews for the full catalog.
 *
 * Per product:
 * - 30 detailed written reviews
 * - 300 total ratings (270 short rating notes + 30 written)
 *
 * Names/cities are region-locked to Indian states for authenticity.
 * Usage: npx tsx scripts/catalog/generate-synthetic-reviews.mts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalogDir = path.join(ROOT, "src", "data", "catalog");

const WRITTEN_PER_PRODUCT = 30;
/** Total ratings generated per product for seed data. */
const RATINGS_PER_PRODUCT = 300;

interface CatalogProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
}

interface SyntheticReview {
  productSku: string;
  productSlug: string;
  name: string;
  city: string;
  state: string;
  rating: number;
  review: string;
  date: string;
  synthetic: true;
  verifiedPurchase: boolean;
  kind: "written" | "rating";
}

interface Region {
  state: string;
  cities: string[];
  firstNames: string[];
  lastNames: string[];
}

const SHARED_FIRST = [
  "Arjun", "Rohit", "Amit", "Kunal", "Vikram", "Nikhil", "Rahul", "Suresh",
  "Deepak", "Ankit", "Pranav", "Harsh", "Manish", "Siddharth", "Abhishek",
  "Ravi", "Karan", "Aditya", "Yash", "Varun", "Saurabh", "Gaurav", "Pooja",
  "Ananya", "Neha", "Priya", "Sneha", "Kavya", "Meera", "Divya", "Isha",
  "Riya", "Shruti", "Tanvi", "Nisha", "Swati", "Pallavi", "Imran", "Farhan",
  "Sameer", "Kabir", "Dev", "Ishaan", "Ayaan", "Rekha", "Sunita", "Kavita",
  "Anita", "Sanjay", "Rajesh", "Manoj", "Vivek", "Ashok", "Naveen", "Ritu",
];

const REGIONS: Region[] = [
  {
    state: "West Bengal",
    cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kharagpur", "Bardhaman"],
    firstNames: [...SHARED_FIRST, "Sayan", "Debanjan", "Souvik", "Anirban", "Ritwik", "Tania", "Moumita", "Shreya"],
    lastNames: [
      "Mukherjee", "Chatterjee", "Ghosh", "Das", "Paul", "Dutta", "Nandi",
      "Dasgupta", "Basu", "Saha", "Banik", "Bose", "Sen", "Roy", "Banerjee",
      "Ganguly", "Bhattacharya", "Chakraborty", "Mitra", "Lahiri",
    ],
  },
  {
    state: "Bihar",
    cities: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Purnea"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sharma", "Singh", "Yadav", "Prasad", "Mishra", "Sinha", "Kumar", "Gupta", "Pandey", "Thakur"],
  },
  {
    state: "Jharkhand",
    cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    firstNames: SHARED_FIRST,
    lastNames: ["Singh", "Oraon", "Munda", "Prasad", "Sharma", "Gupta", "Sahu", "Mahato"],
  },
  {
    state: "Odisha",
    cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
    firstNames: SHARED_FIRST,
    lastNames: ["Patra", "Das", "Sahoo", "Mohanty", "Nayak", "Panda", "Mishra", "Rout", "Behera"],
  },
  {
    state: "Assam",
    cities: ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur"],
    firstNames: SHARED_FIRST,
    lastNames: ["Das", "Sharma", "Baruah", "Gogoi", "Saikia", "Kalita", "Bora", "Deka", "Choudhury"],
  },
  {
    state: "Uttar Pradesh",
    cities: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida", "Ghaziabad", "Prayagraj", "Meerut"],
    firstNames: SHARED_FIRST,
    lastNames: [
      "Gupta", "Sharma", "Mishra", "Pandit", "Tripathi", "Shukla", "Verma",
      "Yadav", "Singh", "Prasad", "Tiwari", "Dubey", "Awasthi", "Dixit", "Srivastava",
    ],
  },
  {
    state: "Madhya Pradesh",
    cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sharma", "Gupta", "Verma", "Singh", "Jain", "Patel", "Mishra", "Tomar", "Rathore"],
  },
  {
    state: "Rajasthan",
    cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sharma", "Singh", "Rathore", "Choudhary", "Jain", "Meena", "Shekhawat", "Gupta", "Acharya"],
  },
  {
    state: "Delhi",
    cities: ["New Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh", "Lajpat Nagar"],
    firstNames: SHARED_FIRST,
    lastNames: [
      "Sharma", "Gupta", "Singh", "Verma", "Kapoor", "Malhotra", "Chopra",
      "Khanna", "Arora", "Bhatia", "Sethi", "Mehta", "Ahuja", "Bansal",
    ],
  },
  {
    state: "Haryana",
    cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"],
    firstNames: SHARED_FIRST,
    lastNames: ["Singh", "Yadav", "Sharma", "Malik", "Hooda", "Dahiya", "Grewal", "Bansal"],
  },
  {
    state: "Punjab",
    cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Chandigarh"],
    firstNames: SHARED_FIRST,
    lastNames: ["Singh", "Kaur", "Gill", "Sandhu", "Brar", "Dhillon", "Sidhu", "Bhatia", "Arora"],
  },
  {
    state: "Himachal Pradesh",
    cities: ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sharma", "Thakur", "Verma", "Chauhan", "Rana", "Negi", "Katoch"],
  },
  {
    state: "Uttarakhand",
    cities: ["Dehradun", "Haridwar", "Nainital", "Haldwani", "Rishikesh"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sharma", "Rawat", "Negi", "Bisht", "Panwar", "Joshi", "Tiwari", "Semwal"],
  },
  {
    state: "Gujarat",
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
    firstNames: SHARED_FIRST,
    lastNames: ["Patel", "Shah", "Mehta", "Desai", "Joshi", "Trivedi", "Modi", "Parekh", "Dave", "Chauhan"],
  },
  {
    state: "Maharashtra",
    cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur"],
    firstNames: SHARED_FIRST,
    lastNames: [
      "Patil", "Deshmukh", "Joshi", "Kulkarni", "Jadhav", "Shinde", "More",
      "Gaikwad", "Sawant", "Kamble", "Shah", "Mehta", "Singh", "Sharma",
    ],
  },
  {
    state: "Goa",
    cities: ["Panaji", "Margao", "Vasco", "Mapusa"],
    firstNames: SHARED_FIRST,
    lastNames: ["Fernandes", "D'Souza", "Rodrigues", "Pereira", "Naik", "Dias", "Almeida", "Costa"],
  },
  {
    state: "Karnataka",
    cities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi"],
    firstNames: SHARED_FIRST,
    lastNames: [
      "Rao", "Shetty", "Gowda", "Hegde", "Kulkarni", "Joshi", "Patil",
      "Sharma", "Nayak", "Bhat", "Kamath", "Shenoy", "Acharya",
    ],
  },
  {
    state: "Tamil Nadu",
    cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"],
    firstNames: SHARED_FIRST,
    lastNames: ["Iyer", "Iyengar", "Krishnan", "Raman", "Subramanian", "Natarajan", "Murugan", "Selvam", "Pillai"],
  },
  {
    state: "Kerala",
    cities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kannur", "Alappuzha"],
    firstNames: SHARED_FIRST,
    lastNames: ["Nair", "Menon", "Pillai", "Kurian", "Thomas", "Jose", "Mathew", "Varma", "Warrier", "Nambiar"],
  },
  {
    state: "Andhra Pradesh",
    cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore"],
    firstNames: SHARED_FIRST,
    lastNames: ["Reddy", "Rao", "Naidu", "Raju", "Chowdary", "Sharma", "Prasad", "Rao"],
  },
  {
    state: "Telangana",
    cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    firstNames: SHARED_FIRST,
    lastNames: ["Reddy", "Rao", "Goud", "Naidu", "Sharma", "Singh", "Khan", "Yadav"],
  },
  {
    state: "Chhattisgarh",
    cities: ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sahu", "Verma", "Sharma", "Singh", "Yadav", "Dewangan", "Patel", "Nishad"],
  },
  {
    state: "Jammu and Kashmir",
    cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    firstNames: SHARED_FIRST,
    lastNames: ["Bhat", "Dar", "Shah", "Khan", "Wani", "Mir", "Malik", "Kaul", "Raina"],
  },
  {
    state: "Manipur",
    cities: ["Imphal", "Thoubal", "Churachandpur"],
    firstNames: SHARED_FIRST,
    lastNames: ["Singh", "Devi", "Sharma", "Meitei", "Khumanthem", "Yumnam"],
  },
  {
    state: "Meghalaya",
    cities: ["Shillong", "Tura", "Jowai"],
    firstNames: SHARED_FIRST,
    lastNames: ["Lyngdoh", "Khongwir", "Sangma", "Marak", "Momin", "Dkhar"],
  },
  {
    state: "Tripura",
    cities: ["Agartala", "Udaipur", "Dharmanagar"],
    firstNames: SHARED_FIRST,
    lastNames: ["Das", "Debbarma", "Saha", "Ghosh", "Chakma", "Reang", "Paul"],
  },
  {
    state: "Sikkim",
    cities: ["Gangtok", "Namchi", "Gyalshing"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sherpa", "Bhutia", "Lepcha", "Pradhan", "Sharma", "Gurung", "Tamang"],
  },
  {
    state: "Nagaland",
    cities: ["Kohima", "Dimapur", "Mokokchung"],
    firstNames: SHARED_FIRST,
    lastNames: ["Ao", "Angami", "Sema", "Lotha", "Jamir", "Yanthan"],
  },
  {
    state: "Mizoram",
    cities: ["Aizawl", "Lunglei", "Champhai"],
    firstNames: SHARED_FIRST,
    lastNames: ["Lal", "Ralte", "Sailo", "Chhangte", "Pachuau", "Fanai"],
  },
  {
    state: "Arunachal Pradesh",
    cities: ["Itanagar", "Tawang", "Pasighat", "Naharlagun"],
    firstNames: SHARED_FIRST,
    lastNames: ["Dhar", "Pertin", "Koyu", "Taki", "Riba", "Danggen", "Sharma"],
  },
  {
    state: "West Bengal Hills",
    cities: ["Darjeeling", "Kalimpong", "Kurseong"],
    firstNames: SHARED_FIRST,
    lastNames: ["Sherpa", "Tamang", "Gurung", "Pradhan", "Lama", "Rai", "Subba"],
  },
];

// Extra surnames requested — weave into North / East pools via alias regions
REGIONS.push({
  state: "Uttar Pradesh",
  cities: ["Lucknow", "Gorakhpur", "Bareilly", "Aligarh"],
  firstNames: SHARED_FIRST,
  lastNames: ["Gautam", "Acharya", "Devi", "Shaw", "Dhar", "Modi", "Pandit", "Shukla"],
});

type CategoryKey =
  | "mixer"
  | "speaker"
  | "mic"
  | "stand"
  | "headphones"
  | "cymbal"
  | "sticks"
  | "clap"
  | "guitar"
  | "amp"
  | "ukulele"
  | "keyboard-stand"
  | "music-stand"
  | "general";

const WRITTEN_POOLS: Record<CategoryKey, Record<number, string[]>> = {
  mixer: {
    5: [
      "Using this mixer for weekend gigs and church programmes. Channels stay clean and Bluetooth pairing is quick. Excellent value for Indian stage work.",
      "Bought for our home studio in {city}. USB recording is smooth and the onboard effects are usable for karaoke nights without extra pedals.",
      "Very practical for DJ plus live band setups. Faders feel decent, layout is simple, and the output remains clear when we push volume.",
      "Enough inputs for our small PA. Setup took minutes after unboxing. Recommended if you need USB and Bluetooth in one console.",
      "Been running temple and community programmes with this for months. Reliable, no random dropouts, and EQ is easy for volunteers to learn.",
    ],
    4: [
      "Sound quality is good for the price. EQ section helps a lot. Manual could be clearer, but once set it performs well at functions.",
      "Happy with clarity and channel count. Bluetooth range is average indoors. Overall a dependable choice for small events.",
      "Works well for karaoke and house parties. Slight hiss only if gain is pushed too high. Packaging was okay, unit arrived safe.",
      "Solid mid-range mixer. For outdoor mela use you may want a second unit, but for halls it is more than enough.",
    ],
    3: [
      "Does the job for practice sessions. Features are fine, though knobs feel a bit light. Fine for beginners, not a touring console.",
      "Decent mixer, nothing fancy. Bluetooth needs reconnect after power cycle which is annoying. Sound is acceptable for home use.",
      "Average experience after three weeks. It works, but I expected slightly quieter preamps at this price.",
    ],
    2: [
      "Okay for basic practice, but for paid gigs I still prefer my older mixer. Channel balance needed frequent tweaking.",
    ],
  },
  speaker: {
    5: [
      "Very clean sound and the DSP works really well. Good speaker for live performance and small events across {city}.",
      "Using it for band practice. Vocals stay clear even at higher volume. DSP presets save time before every rehearsal.",
      "Excellent speaker in this price range. Build feels solid and projection is impressive for indoor wedding functions.",
      "Powerful enough for society halls. Bass is controlled and mids are clear. Happy with the purchase from Vibe Music.",
      "Paired two units for a college fest. Coverage was even and feedback was manageable with careful mic placement.",
    ],
    4: [
      "Sound output is powerful and clear. Bass response is good. Overall satisfied after multiple weekend gigs.",
      "Good clarity and enough power for indoor programmes. Setup was simple. Outer carton could be stronger.",
      "Performs well for DJ nights in community halls. Highs are crisp. Carry handle could be more comfortable.",
      "Reliable active speaker. For open lawn sangeet you may still need a second box, otherwise recommended.",
    ],
    3: [
      "Okay for small rooms. For open lawn events you will need a pair. DSP helps, but manual tuning takes practice.",
      "Sound is fine after EQ. Cabinet had a minor scuff from shipping. Functionally no major complaints.",
      "Average throw for large mandaps. Fine for practice rooms and tuition classes.",
    ],
    2: [
      "Expected more low-end for dhol-heavy tracks. Usable after EQ, but not my first choice for big outdoor stages.",
    ],
  },
  mic: {
    5: [
      "Clear vocal pickup for bhajans and stage singing. Feedback control is better than my previous dynamic mic.",
      "Using for YouTube covers and live sets. Warm midrange and solid build. Good buy for Indian stages.",
      "Reliable for temple programmes and school annual day. Included cable quality is decent for the price.",
      "Natural voice reproduction for Hindi and Bengali vocals. Holds up well on humid outdoor evenings.",
    ],
    4: [
      "Good clarity for the price. Slight handling noise if you move a lot. Otherwise satisfied for weekly gigs.",
      "Works well with our mixer. Presence is nice for vocals. Foam windscreen could be thicker.",
      "Solid everyday mic. Not ultra-premium, but dependable for tuition and small stage work.",
    ],
    3: [
      "Average microphone. Fine for practice; for large outdoor stages you may want something more premium.",
      "Does the basics. Presence boost helps, but off-axis rejection is only okay.",
    ],
    2: [
      "Usable, yet I heard more handling noise than expected. Returned to careful technique and it improved.",
    ],
  },
  stand: {
    5: [
      "Sturdy stand and the height lock holds through long sets. Folds compact for travel gigs from {city}.",
      "Bought for studio and stage. Base stays stable on tiled floors with no wobble under a heavy mic.",
      "Clutch is firm and the boom arm angle stays put. Good hardware for weekly programmes.",
    ],
    4: [
      "Good build for the money. Clutch is firm. Wish a spare clutch nut was included in the box.",
      "Stable for daily practice. Boom arm is useful. Finish is basic but functional.",
    ],
    3: [
      "Does the job. A bit heavy to carry upstairs to the terrace practice room. Fine for home use.",
    ],
    2: [
      "Legs feel a little thin for windy outdoor stages. Indoors it is acceptable.",
    ],
  },
  headphones: {
    5: [
      "Comfortable for long mixing sessions. Isolation is good in a noisy flat. Sound is balanced for tracking.",
      "Using for vocal tracking. Detail is clear without harsh highs. Cable length works well in our booth.",
      "Closed-back monitoring that helps in shared apartments. Earcups seal nicely without too much clamp.",
    ],
    4: [
      "Nice closed-back feel. Bass is controlled. Pads get warm after two hours, otherwise good.",
      "Clear monitoring for practice. Folding design helps for travel. A hard case would have been nice.",
    ],
    3: [
      "Okay headphones. A bit bright for my taste. Fine after a light EQ cut on the interface.",
    ],
    2: [
      "Comfort is average for long sessions. Sound is usable, but I prefer my older pair for mixing.",
    ],
  },
  cymbal: {
    5: [
      "Bright crash with good wash for rock and fusion sets. Looks premium on the kit and cuts live mixes.",
      "Cut through nicely in live gigs. Stick response feels consistent across the bow and bell.",
      "Happy with the tone for studio recording. Controlled sustain without excessive trashiness.",
    ],
    4: [
      "Good sound for the price. Pairs well with my existing hats. Logo print could be sharper.",
      "Using in practice room and small stages. Projection is fine and packing was careful.",
    ],
    3: [
      "Decent intermediate cymbal. Pros may want heavier models. Fine for learning dynamics.",
    ],
    2: [
      "Tone is thinner than I hoped for metal practice. Okay as a secondary crash.",
    ],
  },
  sticks: {
    5: [
      "Balanced sticks with a smooth finish. Great for long practice without hand fatigue.",
      "Hickory feel is solid. Tip shape gives clean definition on hats and ride for stage work.",
    ],
    4: [
      "Good pair for the price. Finish looks premium. Tiny varnish spot on one stick, still usable.",
      "Nice rebound. Using for coaching students as well. Would repurchase.",
    ],
    3: [
      "Average sticks. Fine for practice. Advanced players may prefer a different weight class.",
    ],
    2: [
      "Wear showed sooner than expected in daily practice. Acceptable as a budget spare pair.",
    ],
  },
  clap: {
    5: [
      "Crisp clap sound for percussion beds. Handy in studio and acoustic live sets.",
      "Unique add-on for our folk fusion setup. Easy to play and surprisingly loud on stage.",
    ],
    4: [
      "Fun accessory that works on recordings. Build is light and good for rhythm layering.",
    ],
    3: [
      "Interesting product. Useful occasionally, not something you need every gig.",
    ],
    2: [
      "Novelty factor is high, but I rarely reach for it in serious sessions.",
    ],
  },
  guitar: {
    5: [
      "Beautiful tone for bhajans and light classical practice. Action was comfortable after a quick local setup.",
      "Bought for music class. Intonation is good and finish looks premium. Teacher was happy with it.",
      "Warm acoustic sound with nice room projection. Ideal from beginner into intermediate level.",
      "Electro model works well into our church PA. EQ helps manage feedback on louder evenings.",
      "Resonance is rich for open chords and fingerstyle. Tuners hold well through monsoon humidity.",
    ],
    4: [
      "Good guitar for the price. Needed slight neck relief. After setup, fretting is clean across the neck.",
      "Tone is pleasant. Tuners hold okay. Case quality is basic, but the instrument itself is solid.",
      "Using for YouTube covers. Camera-friendly finish. Minor buzz on high frets until a proper setup.",
      "Satisfied overall. Expect a shop setup after delivery like most guitars in this range.",
    ],
    3: [
      "Decent beginner guitar. Plan a professional setup. Stock strings were average and got changed immediately.",
      "Looks nice, sound is okay for practice. For demanding stage lead work you may outgrow it.",
    ],
    2: [
      "Playable after setup, but QC on the nut slots felt rushed. Sortable, yet not a perfect unboxing.",
    ],
  },
  amp: {
    5: [
      "Clear practice amp with useful tone controls. Perfect for flat practice without disturbing neighbours much.",
      "Enough volume for small house concerts. Clean channel sounds natural with acoustic-electric guitars.",
    ],
    4: [
      "Portable and practical. Sound is clear. Headphone jack area could feel sturdier.",
      "Good for rehearsals. At max volume it compresses a little, but for home use it is excellent.",
    ],
    3: [
      "Fine starter amp. Not loud enough for outdoor functions. For bedroom practice it works.",
    ],
    2: [
      "Clean tone is okay, but I wanted more headroom. Acceptable only for quiet practice.",
    ],
  },
  ukulele: {
    5: [
      "Sweet tone and the carry bag helps for travel. Lovely gift for beginners in the family.",
      "Easy chord learning on this uke. Finish is smooth and frets are tidy out of the box.",
    ],
    4: [
      "Nice ukulele for the price. Tuned up quickly. Bag zip could be stronger; instrument is good.",
    ],
    3: [
      "Okay for learning. Action is a little high for small hands. Still usable after a light setup.",
    ],
    2: [
      "Intonation on the higher frets is only average. Fine for first songs, not for recording.",
    ],
  },
  "keyboard-stand": {
    5: [
      "Holds my 61-key board firmly. Height options suit both sitting practice and standing gigs.",
      "Sturdy X-style stand. Folds flat for society events and college fests around {city}.",
    ],
    4: [
      "Good stability. Locking mechanism is firm. Rubber caps help on marble flooring.",
    ],
    3: [
      "Works fine. A bit bulky on local trains. For home studio use it is okay.",
    ],
    2: [
      "Acceptable, but I would not load a very heavy workstation on it for long shows.",
    ],
  },
  "music-stand": {
    5: [
      "Lightweight yet stable. Desk angle holds thick songbooks without slipping mid-rehearsal.",
      "Perfect for orchestra practice and school band. Folds quickly after rehearsals.",
    ],
    4: [
      "Good stand for the price. Tray is wide enough. A carry bag would have been welcome.",
    ],
    3: [
      "Does the basics. Can tip with a very heavy binder. Fine for single sheets and slim books.",
    ],
    2: [
      "Usable indoors. Outdoor breeze made pages flutter more than I liked.",
    ],
  },
  general: {
    5: [
      "Reliable gear for live and studio use. Feels well made and performs as expected in {city} conditions.",
      "Ordered from Vibe Music; delivery was on time. Product quality is good and packaging was secure.",
      "Clean performance for the money. Would recommend to fellow musicians in my circle.",
    ],
    4: [
      "Solid product for Indian stage humidity and travel. Minor cosmetic mark on arrival, performance is fine.",
      "Good value overall. Manual is basic but every listed feature works as advertised.",
    ],
    3: [
      "Average experience. It works, but not outstanding. Okay if you are buying on a tight budget.",
    ],
    2: [
      "Functional, yet finishing quality felt mixed. Keeping it for now after basic checks.",
    ],
  },
};

const SHORT_NOTES: Record<number, string[]> = {
  5: [
    "Excellent product. Highly recommended.",
    "Outstanding value for money.",
    "Working perfectly after two weeks.",
    "Very happy with this purchase.",
    "Top quality for the price range.",
    "Reliable gear. Will buy again.",
    "Clear sound and solid build.",
    "Great for practice and small gigs.",
    "Delivered on time. Product is superb.",
    "Exactly what I needed for stage use.",
  ],
  4: [
    "Good product overall. Satisfied.",
    "Worth the price. Minor packaging issue.",
    "Performs well for daily practice.",
    "Nice quality. Happy with the buy.",
    "Solid choice for beginners and intermediates.",
    "Works as expected. No major complaints.",
    "Good clarity and decent build.",
    "Recommended with a professional setup.",
    "Useful for home and small events.",
    "Value for money in this segment.",
  ],
  3: [
    "Average product. Okay for the price.",
    "Does the job, nothing exceptional.",
    "Fine for basic use after setup.",
    "Acceptable quality for beginners.",
    "Mixed feelings, but usable.",
    "Okay purchase for practice only.",
    "Not bad, not amazing either.",
    "Works, though expectations were higher.",
  ],
  2: [
    "Below expectations on finishing.",
    "Usable, but I expected better QC.",
    "Average experience after first month.",
    "Okay temporarily until I upgrade.",
  ],
  1: [
    "Not satisfied with the overall quality.",
    "Had issues after unboxing. Support helped later.",
  ],
};

function classify(product: CatalogProduct): CategoryKey {
  const n = `${product.name} ${product.slug}`.toLowerCase();
  if (/(cymbal|dazyan|distack|hathor|zapcrash|crystone|theo)/.test(n)) return "cymbal";
  if (/(drumstick|neo gold|zgen)/.test(n)) return "sticks";
  if (n.includes("clap")) return "clap";
  if (n.includes("ukulele")) return "ukulele";
  if (/(amplifier|dg20|dg40)/.test(n)) return "amp";
  if (/(headphones|hdm)/.test(n)) return "headphones";
  if (/(keyboard stand|ax kb)/.test(n)) return "keyboard-stand";
  if (/(music stand|ax ns)/.test(n)) return "music-stand";
  if (/(microphone stand|ax mcs)/.test(n) || (n.includes("stand") && n.includes("mic"))) return "stand";
  if (/(microphone|aedan|\bmic\b)/.test(n)) return "mic";
  if (/(speaker|dsp|pa-|\bpa\b)/.test(n)) return "speaker";
  if (/(mixer|acm|acon|ams|adm|admic)/.test(n)) return "mixer";
  if (/(guitar|hza|hzr)/.test(n)) return "guitar";
  return "general";
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

function formatDate(rng: () => number): string {
  // Rolling window: random day within the last 3 years from generation time.
  const end = Date.now();
  const start = end - Math.round(3 * 365.25 * 24 * 60 * 60 * 1000);
  const t = start + Math.floor(rng() * (end - start));
  return new Date(t).toISOString().slice(0, 10);
}

function pickRating(rng: () => number, written: boolean): number {
  const roll = rng();
  if (written) {
    if (roll < 0.48) return 5;
    if (roll < 0.82) return 4;
    if (roll < 0.95) return 3;
    if (roll < 0.99) return 2;
    return 1;
  }
  // Rating-only mix still positive-leaning but with natural variance
  if (roll < 0.5) return 5;
  if (roll < 0.84) return 4;
  if (roll < 0.95) return 3;
  if (roll < 0.985) return 2;
  return 1;
}

function uniquePerson(
  rng: () => number,
  used: Set<string>
): { name: string; city: string; state: string } {
  for (let i = 0; i < 60; i += 1) {
    const region = pick(rng, REGIONS);
    const name = `${pick(rng, region.firstNames)} ${pick(rng, region.lastNames)}`;
    const city = pick(rng, region.cities);
    const key = `${name}|${city}|${region.state}`;
    if (!used.has(key)) {
      used.add(key);
      return { name, city, state: region.state };
    }
  }
  const region = pick(rng, REGIONS);
  return {
    name: `${pick(rng, region.firstNames)} ${pick(rng, region.lastNames)}`,
    city: pick(rng, region.cities),
    state: region.state,
  };
}

function writtenText(
  rng: () => number,
  category: CategoryKey,
  rating: number,
  city: string
): string {
  const pool = WRITTEN_POOLS[category] ?? WRITTEN_POOLS.general;
  const options = pool[rating] ?? pool[4] ?? pool[5]!;
  let text = pick(rng, options).replaceAll("{city}", city);
  const tails =
    rating >= 5
      ? [" Would recommend to fellow musicians.", " Support experience was smooth.", ""]
      : rating === 4
        ? [" Delivery was on time.", " Overall worth buying.", ""]
        : rating === 3
          ? [" Sharing an honest take after regular use.", ""]
          : [" Hope QC improves in future batches.", ""];
  return `${text}${pick(rng, tails)}`.trim();
}

function shortText(rng: () => number, rating: number): string {
  return pick(rng, SHORT_NOTES[rating] ?? SHORT_NOTES[4]!);
}

function main() {
  const products = JSON.parse(
    fs.readFileSync(path.join(catalogDir, "products.json"), "utf8")
  ) as CatalogProduct[];

  const usedPeople = new Set<string>();
  const reviews: SyntheticReview[] = [];

  const ad12Samples: SyntheticReview[] = [
    {
      productSku: "VM-AD12DSP",
      productSlug: "adeon-ad12-dsp-ad12-dsp",
      name: "Arjun Sen",
      city: "Kolkata",
      state: "West Bengal",
      rating: 5,
      review:
        "Very clean sound and the DSP works really well. Good speaker for live performance and small events.",
      date: "2024-02-18",
      synthetic: true,
      verifiedPurchase: true,
      kind: "written",
    },
    {
      productSku: "VM-AD12DSP",
      productSlug: "adeon-ad12-dsp-ad12-dsp",
      name: "Rohit Das",
      city: "Howrah",
      state: "West Bengal",
      rating: 4,
      review:
        "Sound output is powerful and clear. Bass response is good, overall satisfied with the product.",
      date: "2024-06-09",
      synthetic: true,
      verifiedPurchase: true,
      kind: "written",
    },
    {
      productSku: "VM-AD12DSP",
      productSlug: "adeon-ad12-dsp-ad12-dsp",
      name: "Sayan Roy",
      city: "Durgapur",
      state: "West Bengal",
      rating: 5,
      review:
        "Using it for our band practice. Vocals are clear even at higher volume. DSP controls are useful.",
      date: "2025-01-22",
      synthetic: true,
      verifiedPurchase: true,
      kind: "written",
    },
    {
      productSku: "VM-AD12DSP",
      productSlug: "adeon-ad12-dsp-ad12-dsp",
      name: "Amit Sharma",
      city: "Delhi",
      state: "Delhi",
      rating: 5,
      review:
        "Excellent speaker in this price range. Build quality feels solid and sound projection is impressive.",
      date: "2025-08-14",
      synthetic: true,
      verifiedPurchase: true,
      kind: "written",
    },
    {
      productSku: "VM-AD12DSP",
      productSlug: "adeon-ad12-dsp-ad12-dsp",
      name: "Kunal Mehta",
      city: "Pune",
      state: "Maharashtra",
      rating: 4,
      review:
        "Good clarity and enough power for indoor gigs. Setup was simple. Packaging could be better.",
      date: "2026-03-07",
      synthetic: true,
      verifiedPurchase: false,
      kind: "written",
    },
  ];

  for (const product of products) {
    const rng = mulberry32(hashSeed(`v2:${product.slug}`));
    const category = classify(product);
    const bucket: SyntheticReview[] = [];

    if (product.slug === "adeon-ad12-dsp-ad12-dsp") {
      for (const sample of ad12Samples) {
        usedPeople.add(`${sample.name}|${sample.city}|${sample.state}`);
        bucket.push(sample);
      }
    }

    while (bucket.filter((r) => r.kind === "written").length < WRITTEN_PER_PRODUCT) {
      const person = uniquePerson(rng, usedPeople);
      const rating = pickRating(rng, true);
      bucket.push({
        productSku: product.sku,
        productSlug: product.slug,
        name: person.name,
        city: person.city,
        state: person.state,
        rating,
        review: writtenText(rng, category, rating, person.city),
        date: formatDate(rng),
        synthetic: true,
        verifiedPurchase: rng() > 0.22,
        kind: "written",
      });
    }

    while (bucket.length < RATINGS_PER_PRODUCT) {
      const person = uniquePerson(rng, usedPeople);
      const rating = pickRating(rng, false);
      bucket.push({
        productSku: product.sku,
        productSlug: product.slug,
        name: person.name,
        city: person.city,
        state: person.state,
        rating,
        review: shortText(rng, rating),
        date: formatDate(rng),
        synthetic: true,
        verifiedPurchase: rng() > 0.35,
        kind: "rating",
      });
    }

    bucket.sort((a, b) => a.date.localeCompare(b.date));
    reviews.push(...bucket);
  }

  const outPath = path.join(catalogDir, "synthetic-reviews.json");
  fs.writeFileSync(outPath, `${JSON.stringify(reviews, null, 2)}\n`, "utf8");

  const written = reviews.filter((r) => r.kind === "written").length;
  const states = new Set(reviews.map((r) => r.state));
  console.log(
    `Wrote ${reviews.length} reviews (${written} written) for ${products.length} products`
  );
  console.log(
    `Per product: ${RATINGS_PER_PRODUCT} ratings, ${WRITTEN_PER_PRODUCT}+ written`
  );
  console.log(
    `Rating mix: ${[5, 4, 3, 2, 1]
      .map((n) => `${n}★=${reviews.filter((r) => r.rating === n).length}`)
      .join(", ")}`
  );
  console.log(`States represented: ${states.size}`);
  console.log(`→ ${outPath}`);
}

main();
