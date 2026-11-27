export const expertiseTags = [
  "Startup & Fundraising",
  "Career & Jobs",
  "Legal & Compliance",
  "Tax & Finance",
  "Education & Admissions",
  "SMB Growth",
  "Creator Access",
  "Enterprise Learning"
] as const;

export type ExpertiseTag = (typeof expertiseTags)[number];

export type Review = {
  userName: string;
  userAvatar?: string;
  consultationType: string;
  dateString: string;
  rating: number;
  text: string;
};

export type ExpertAvailability = {
  id?: string;
  days: string[];
  fromTime: string;
  toTime: string;
};

export type Expert = {
  id?: string;
  name: string;
  role: string;
  desc: string;
  image: string;
  category?: string;
  topics: ExpertiseTag[];
  languages: string[];
  price: number;
  rating: number;
  replyTime: string;
  reviewsCount?: number;
  sessionsCompleted?: string;
  experienceLevel?: string;
  location?: string;
  sampleAnswers?: { question: string; answer: string }[];
  reviews?: Review[];
  bio?: string;
  email?: string;
  phone?: string;
  formats?: string[];
  formatPrices?: Record<string, string | number>;
  availabilities?: ExpertAvailability[];
  timezone?: string;
  matchTier?: number;
};

const sampleAnswerByTopic: Record<ExpertiseTag, { question: string; answer: string }[]> = {
  "Career & Jobs": [
    {
      question: "How should I negotiate a higher salary in my current role?",
      answer:
        "Start with market data for your level and city, then build a one-page impact brief: revenue saved, projects shipped, and scope you already own. Ask for a conversation about compensation, not a favour. Anchor with your research range, propose a specific number, and be ready to discuss role scope if budget is tight.",
    },
    {
      question: "What is the best way to transition from marketing to product management?",
      answer:
        "Start by owning product-adjacent tasks in your current role like user research or data analysis. Build a portfolio of small product improvements, learn tech basics, and target internal transfers where your domain knowledge is already valued."
    }
  ],
  "Education & Admissions": [
    {
      question: "What should my SOP focus on for a competitive masters application?",
      answer:
        "Lead with a clear problem you want to solve, not a biography. Show one or two concrete projects or outcomes, explain why this program fits your next step, and end with what you will contribute to the cohort. Admissions teams reward specificity, not generic ambition.",
    },
    {
      question: "How early should I start preparing for my study abroad applications?",
      answer:
        "Begin 12-15 months before your target intake. Spend the first 3 months researching universities and taking standardized tests, the next 3 months drafting SOPs and securing recommendations, and the remaining time preparing financial documents and submitting applications."
    }
  ],
  "Tax & Finance": [
    {
      question: "How should I handle GST and tax planning as a solo creator?",
      answer:
        "Track income monthly, separate business expenses, and check whether you have crossed GST registration thresholds for your category. File on schedule even when cash flow is uneven, and set aside 25-30% of net income for tax reserves until your CA confirms a better rate.",
    },
    {
      question: "What are the key tax deductions available for freelance developers?",
      answer:
        "You can deduct business expenses like internet bills, software subscriptions, co-working desk rent, laptop depreciation, and travel costs directly related to client meetings. Keep all invoices organized to claim these under Section 44ADA."
    }
  ],
  "Legal & Compliance": [
    {
      question: "Do I need an ESOP pool before my seed round?",
      answer:
        "Most seed investors expect a 10-15% option pool created pre-money or clearly accounted for in the cap table. If you are hiring senior talent soon, set the pool before term sheet negotiations so you are not negotiating both valuation and dilution at once.",
    },
    {
      question: "What key clauses should be in a founder agreement?",
      answer:
        "Ensure you have clear equity split, vesting schedules (typically 4 years with a 1-year cliff), roles and responsibilities, and IP assignment clauses. Also include exit and buyout provisions in case a founder leaves early."
    }
  ],
  "Startup & Fundraising": [
    {
      question: "When is the right time to start fundraising for a pre-revenue startup?",
      answer:
        "Raise when you have a sharp problem insight, a credible team, and a plan that shows what 18-24 months of capital will unlock. Investors back momentum and clarity. If you cannot explain why now is the right moment, spend another sprint on customer proof before opening a round.",
    },
    {
      question: "What is the most common reason pitch decks get rejected by VCs?",
      answer:
        "Lack of a clear problem statement and a confusing business model. VCs want to see a massive market opportunity, a unique solution with customer proof, and a team capable of executing. Keep it under 12 slides and lead with the market pain."
    }
  ],
  "SMB Growth": [
    {
      question: "When should a D2C brand start spending on paid acquisition?",
      answer:
        "Scale paid only after repeat purchase or retention looks healthy and you know your fully loaded CAC payback. Start with small channel tests, measure contribution margin, and increase budget only when payback stays inside 3-4 months for your category.",
    },
    {
      question: "How do I lower my customer acquisition cost (CAC) on Meta ads?",
      answer:
        "Focus on creative testing first. A high hook rate and clear value proposition in your video creatives do more for your CTR than hyper-targeted audience settings. Retarget warm audiences and set up email flows to maximize LTV."
    }
  ],
  "Creator Access": [
    {
      question: "How do I pitch brands when I am under 50k followers?",
      answer:
        "Lead with engagement rate, audience fit, and past campaign results rather than follower count. Package one media kit with niche, demographics, content samples, and rate card. Smaller creators win when they can prove conversion in a tight audience.",
    },
    {
      question: "How should I price a sponsored post on Instagram?",
      answer:
        "Start with a baseline rate of 1-2% of your follower count, then adjust upwards based on your average engagement rate, production cost (video vs static), and whether the brand wants usage rights for paid ads."
    }
  ],
  "Enterprise Learning": [
    {
      question: "How do we measure ROI on an enterprise upskilling program?",
      answer:
        "Define business KPIs before launch: time-to-productivity, quality defects, pipeline velocity, or retention. Pair pre/post skill assessments with manager check-ins at 30 and 90 days. ROI should tie learning outcomes to one operational metric leadership already tracks.",
    },
    {
      question: "What is the key to high completion rates in corporate training?",
      answer:
        "Make learning bite-sized and integrated into the daily workflow. Pair self-paced modules with interactive peer sessions, align training with career progression tracks, and get active sponsorship from leadership."
    }
  ],
};

function defaultReviewsFor(expert: Expert): Review[] {
  const firstName = expert.name.split(" ")[0];
  const topic = expert.topics[0] || "this area";

  return [
    {
      userName: "Priya S.",
      userAvatar: "/assets/img/avatar1.png",
      consultationType: "Text Consultation",
      dateString: "3 days ago",
      rating: 5,
      text: `${firstName} gave clear, practical advice that I could act on the same day. Exactly the kind of guidance I was looking for.`,
    },
    {
      userName: "Arjun D.",
      consultationType: "Live Call",
      dateString: "1 week ago",
      rating: expert.rating >= 4.8 ? 5 : 4,
      text: `Very helpful session on ${topic.toLowerCase()}. The response was specific to my situation instead of generic tips.`,
    },
  ];
}

function withExpertDetails(expert: Expert): Expert {
  const primaryTopic = expert.topics[0];
  const sampleAnswers = primaryTopic ? sampleAnswerByTopic[primaryTopic] : undefined;

  return {
    ...expert,
    reviewsCount: expert.reviewsCount ?? Math.round(60 + expert.rating * 15),
    sessionsCompleted: expert.sessionsCompleted ?? `${Math.round(120 + expert.rating * 40)}+ Sessions Completed`,
    location: expert.location ?? "India",
    sampleAnswers: expert.sampleAnswers ?? (sampleAnswers ? sampleAnswers : []),
    reviews: expert.reviews ?? defaultReviewsFor(expert),
  };
}

const baseExperts: Expert[] = [
  {
    name: "Prakash Raj",
    role: "National Award-Winning Actor, Director & Producer | Prakash Raj Foundation",
    desc: "5-time National Film Award winner; mentors on stagecraft, creative leadership, and public communication",
    bio: "National Award-winning actor, director, and producer with over 30 years across theatre and multi-lingual Indian cinema (Tamil, Telugu, Kannada, Hindi). Founder of the Prakash Raj Foundation focusing on rural empowerment and education. I advise on voice modulation, narrative authenticity, handling creative criticism, and fearless public communication.",
    image: "/assets/img/influencers/prakash-raj-card.jpg",
    topics: ["Creator Access", "Career & Jobs", "Enterprise Learning"],
    languages: ["Kannada", "Tamil", "Telugu", "Hindi", "English"],
    price: 499,
    rating: 4.9,
    replyTime: "15 min",
    reviewsCount: 420,
    sessionsCompleted: "850+ Sessions Completed",
    location: "Bengaluru, India",
    sampleAnswers: [
      {
        question: "How can actors or public speakers conquer stage fear and project authentic authority?",
        answer: "Fear is merely energy without direction. Don't suppress nervousness—anchor it into your breath and the first sentence. Speak from your diaphragm, maintain steady eye contact with individual people rather than a blurry crowd, and care more about the message reaching them than how clever you appear."
      },
      {
        question: "What should creators and artists prioritize when building long-term career longevity?",
        answer: "Never attach your identity to temporary applause or harsh criticism. Hone the craft during silent seasons, embrace diverse languages and mediums, and maintain an independent voice with social responsibility."
      }
    ],
    reviews: [
      {
        userName: "Karthik R.",
        userAvatar: "/assets/img/avatar1.png",
        consultationType: "Live Call",
        dateString: "2 days ago",
        rating: 5,
        text: "Unbelievable depth of knowledge. Prakash sir's advice on narrative presence completely transformed how I present keynotes."
      },
      {
        userName: "Deepa S.",
        userAvatar: "",
        consultationType: "Text Consultation",
        dateString: "1 week ago",
        rating: 5,
        text: "Such grounded and direct feedback on handling creative transitions. Truly an inspiring mentor."
      }
    ]
  },
  {
    name: "Gaurav Chaudhary",
    role: "Tech Creator, M.Tech Microelectronics | Host of Technical Guruji",
    desc: "India's pioneer tech creator; guides on gadget decisions, consumer tech, and scaling digital content",
    bio: "M.Tech in Microelectronics from BITS Pilani (Dubai) and creator behind Technical Guruji, one of the world's largest Hindi technology channels with over 23 million subscribers. Forbes 30 Under 30 honoree and National Creator Award winner. I break down smartphones, AI hardware, emerging tech gadgets, and share how to build high-reach creator ecosystems.",
    image: "/assets/img/influencers/technical-guruji-card.jpg",
    topics: ["Creator Access", "SMB Growth", "Career & Jobs"],
    languages: ["Hindi", "English"],
    price: 249,
    rating: 4.8,
    replyTime: "8 min",
    reviewsCount: 310,
    sessionsCompleted: "680+ Sessions Completed",
    location: "Dubai & New Delhi",
    sampleAnswers: [
      {
        question: "What should creators prioritize when choosing camera and audio gear on a budget?",
        answer: "Audio is 60% of your video quality—viewers will forgive average 1080p video, but bad muffled audio will make them click away immediately. Invest first in a good wireless lavalier mic and clean key lighting, and use your existing smartphone camera with manual exposure settings."
      },
      {
        question: "How do you stay consistent creating daily tech content for years?",
        answer: "Build a streamlined production workflow: script bullet points instead of full transcripts, batch-record b-roll and unboxings, and stay genuinely curious about consumer problems rather than chasing empty spec sheets."
      }
    ]
  },
  {
    name: "Alakh Pandey",
    role: "Founder & CEO, PhysicsWallah | EdTech Pioneer & Teacher",
    desc: "Built PW into India's premier affordable education unicorn; guides on exam strategy and scaling mission-led startups",
    bio: "Founder and CEO of PhysicsWallah (PW). I started teaching from a whiteboard on YouTube to make quality JEE, NEET, and foundational education accessible to every student in Bharat regardless of financial background. Today PW is a profitable edtech unicorn serving millions of learners. I advise on pedagogy, exam preparation mindset, and mission-driven entrepreneurship.",
    image: "/assets/img/influencers/alakh-pandey-card.jpg",
    topics: ["Education & Admissions", "Startup & Fundraising", "Enterprise Learning"],
    languages: ["Hindi", "English"],
    price: 199,
    rating: 5.0,
    replyTime: "10 min",
    reviewsCount: 450,
    sessionsCompleted: "920+ Sessions Completed",
    location: "Prayagraj & Noida, India",
    sampleAnswers: [
      {
        question: "How should a student overcome burnout and exam anxiety during competitive exam prep?",
        answer: "Padhai ko bojh mat banao—break your daily study into small 45-minute sprint goals. When anxiety hits, stop solving new mock tests for half a day, revise your strongest notes, and remember that an exam tests your preparation on that day, not your self-worth."
      },
      {
        question: "How did PhysicsWallah maintain ultra-low prices while scaling to a unicorn?",
        answer: "By keeping zero marketing spend and building an organic bond of trust with students. When students know you genuinely care about their learning rather than extracting money, word-of-mouth becomes stronger than any multi-crore ad campaign."
      }
    ]
  },
  {
    name: "Nikhil Kamath",
    role: "Co-founder, Zerodha, True Beacon & Gruhas | Investor & Host of 'WTF is?'",
    desc: "Pioneered discount broking in India; advises on bootstrapped scaling, public markets, and venture investing",
    bio: "Co-founder of Zerodha, India's largest retail brokerage built completely bootstrapped, and asset management firm True Beacon. Angel investor and host of the 'WTF is?' podcast. I share candid insights on capital allocation, building sustainable businesses with positive unit economics, navigating public markets, and macro-economic trends in India.",
    image: "/assets/img/influencers/nikhil-kamath-card.jpg",
    topics: ["Tax & Finance", "Startup & Fundraising", "Career & Jobs"],
    languages: ["English", "Hindi", "Kannada"],
    price: 499,
    rating: 4.9,
    replyTime: "15 min",
    reviewsCount: 240,
    sessionsCompleted: "510+ Sessions Completed",
    location: "Bengaluru, India",
    sampleAnswers: [
      {
        question: "Should early founders bootstrap or raise venture capital in today's market?",
        answer: "If your business can generate early customer revenue with healthy gross margins, stay bootstrapped as long as possible. Bootstrapping forces frugality, product obsession, and total independence. Raise VC only when you have proven product-market fit and capital acts as a genuine rocket fuel, not as a substitute for customer validation."
      },
      {
        question: "How should young professionals approach asset allocation in India?",
        answer: "Don't overcomplicate. Start with a solid index fund foundation (Nifty 50 / Next 50), maintain a conservative emergency debt reserve, and avoid high-leverage speculative bets. The secret to wealth compounding is staying in the game for decades without getting wiped out."
      }
    ]
  },
  {
    name: "Dr. Palaniappan Manickam",
    role: "Gastroenterologist & Gut Health Specialist | 'MedCom' Health Educator",
    desc: "Board-certified gastroenterologist & MPH; demystifies gut health, fasting, and metabolic wellness with humor",
    bio: "I am a board-certified gastroenterologist and epidemiologist (MPH) blending medicine with comedy ('MedCom') to make gut health and preventive medicine engaging. With medical training at Wayne State and fellowships in Gastroenterology & Nutrition, I help people understand the gut microbiome, time-restricted eating, and sustainable lifestyle changes to reverse metabolic conditions.",
    image: "/assets/img/influencers/dr-pal-card.jpg",
    topics: ["Education & Admissions", "Creator Access", "Career & Jobs"],
    languages: ["Tamil", "English", "Hindi"],
    price: 399,
    rating: 4.9,
    replyTime: "12 min",
    reviewsCount: 180,
    sessionsCompleted: "420+ Sessions Completed",
    location: "Chennai & California",
    sampleAnswers: [
      {
        question: "What is the simplest way to improve gut microbiome health without fancy supplements?",
        answer: "Focus on variety in plant fibers—aim for 30 different plant foods a week (fruits, veggies, lentils, seeds, spices). Practice time-restricted eating with a 14:10 or 16:8 window to give your gut lining time for cellular repair (migrating motor complex), and stop late-night heavy snacking."
      },
      {
        question: "How does stress directly trigger digestive and acidity issues?",
        answer: "The gut-brain axis is a two-way superhighway connected by the vagus nerve. Acute stress shifts your nervous system into sympathetic 'fight or flight', which throttles stomach acid regulation, slows gastric emptying, and triggers bloating or IBS flare-ups."
      }
    ]
  },
  {
    name: "Dr. Tanaya Narendra",
    role: "MBBS, MSc Clinical Embryology (Oxon) | FRSPH & Bestselling Author",
    desc: "Oxford-trained doctor; champions science-backed, shame-free reproductive health, anatomy, and wellness education",
    bio: "Internationally trained medical doctor, embryologist (University of Oxford), Fellow of the Royal Society for Public Health, and author of the national bestseller 'Dr. Cuterus: Everything Nobody Tells You About Your Body'. I debunk myths around sexual health, fertility, hormonal balances like PCOS, and reproductive anatomy in a warm, stigma-free way.",
    image: "/assets/img/influencers/dr-tanaya-card.jpg",
    topics: ["Education & Admissions", "Creator Access", "Career & Jobs"],
    languages: ["English", "Hindi"],
    price: 299,
    rating: 4.9,
    replyTime: "14 min",
    reviewsCount: 215,
    sessionsCompleted: "480+ Sessions Completed",
    location: "New Delhi & Oxford",
    sampleAnswers: [
      {
        question: "What are the first medical steps someone should take if they suspect PCOS?",
        answer: "First, consult a qualified gynecologist or endocrinologist for a pelvic ultrasound and hormonal blood panel (LH:FSH ratio, free testosterone, insulin resistance markers). Don't fall for crash detox teas on social media—managing PCOS is about insulin sensitivity, resistance training, balanced sleep, and personalized medical guidance."
      },
      {
        question: "How can parents have comfortable, science-grounded body talks with teenagers?",
        answer: "Use accurate anatomical terms early on to remove secrecy and shame. Frame conversations around biology, bodily autonomy, and safety rather than moral judgment, so they feel safe coming to you with questions instead of trusting unvetted internet forums."
      }
    ]
  },
  {
    name: "Raj Shamani",
    role: "Podcaster & Entrepreneur",
    desc: "Host of Figuring Out; guides creators & founders on branding, storytelling, and audience growth",
    bio: "Host of Figuring Out, one of India's top business and leadership podcasts. Founder of House of X, angel investor, and keynote speaker. I help creators, founders, and leaders build authentic brand narratives, unlock media presence, and scale digital-first businesses.",
    image: "/assets/img/influencers/raj-shamani-card.jpg",
    topics: ["Creator Access", "Startup & Fundraising", "Career & Jobs"],
    languages: ["English", "Hindi"],
    price: 299,
    rating: 4.9,
    replyTime: "10 min"
  },
  {
    name: "Harsha Bhogle",
    role: "The Voice of Cricket | Storyteller, IIM Ahmedabad Alum & Keynote Speaker",
    desc: "Legendary sports broadcaster and author of 'The Winning Way'; translates elite team culture into leadership excellence",
    bio: "Chemical Engineer from Osmania University and alumnus of IIM Ahmedabad. Widely recognized globally as the 'Voice of Indian Cricket' with over 40 years behind the microphone across AIR, ABC, BBC, ESPN, and Star Sports. Author of 'The Winning Way'. I consult and speak with corporate leadership teams on high-performance psychology, handling pressure, and champion team cultures.",
    image: "/assets/img/influencers/harsha-bhogle-card.jpg",
    topics: ["Enterprise Learning", "Career & Jobs", "Creator Access"],
    languages: ["English", "Hindi", "Marathi"],
    price: 349,
    rating: 5.0,
    replyTime: "10 min",
    reviewsCount: 380,
    sessionsCompleted: "760+ Sessions Completed",
    location: "Mumbai, India",
    sampleAnswers: [
      {
        question: "What can business leaders learn from champion sports captains about handling high-stakes pressure?",
        answer: "Focus relentlessly on the process, never on the scoreboard. When you worry about the consequence—the trophy, the quarterly target—tension paralyses execution. Great captains like MS Dhoni take pressure out of the system by narrowing the focus to just the very next ball."
      },
      {
        question: "What is the secret to compelling storytelling and public speaking?",
        answer: "Never make the story about yourself—make it about the game, the protagonist, and the audience. Use simple words with evocative verbs, let moments breathe with pauses, and remember that silence in commentary is often as powerful as spoken words."
      }
    ]
  },
  {
    name: "Manasi Chaudhari",
    role: "Founder & CEO, Pink Legal | Oxford MSc in Law & Finance | Corporate & Tech Lawyer",
    desc: "Oxford Law alumna & ex-Supreme Court judicial clerk; guides founders on POSH, agreements, and IP",
    bio: "Founder of Pink Legal, India's first digital platform for women's legal rights. Oxford MSc in Law and Finance graduate, former judicial clerk under CJI D.Y. Chandrachud working on landmark constitutional cases. I guide founders on company incorporation, founder contracts, IP protection, POSH policies, and risk-proof compliance.",
    image: "/assets/img/influencers/manasi-chaudhari-card.jpg",
    topics: ["Legal & Compliance", "Startup & Fundraising", "Career & Jobs"],
    languages: ["English", "Hindi", "Marathi"],
    price: 299,
    rating: 4.9,
    replyTime: "12 min",
    reviewsCount: 260,
    sessionsCompleted: "540+ Sessions Completed",
    location: "Mumbai, India",
    sampleAnswers: [
      {
        question: "What are the essential legal agreements every startup needs before raising angel funds?",
        answer: "First, a robust Founders' Agreement covering equity vesting, IP assignment, and exit clauses. Second, standard employment/contractor agreements with unambiguous IP assignment clauses. Third, non-disclosure agreements (NDAs) for sensitive partnerships. Having these in order prevents fatal red flags during investor due diligence."
      },
      {
        question: "How should modern Indian startups implement an effective POSH compliance framework?",
        answer: "Don't treat POSH as a paper exercise. Establish an Internal Committee (IC) with an experienced external member, draft a transparent gender-neutral grievance mechanism, and conduct mandatory sensitization workshops for every employee annually."
      }
    ]
  },
  {
    name: "Vikas Khanna",
    role: "Michelin-Starred Chef, Restaurateur & Author | Judge, MasterChef India",
    desc: "NYC culinary visionary behind Junoon & Bungalow; guides on hospitality scaling, culinary arts, and food ventures",
    bio: "Michelin-starred chef, author of 40+ books, filmmaker, and restaurateur behind NYC's Bungalow and Junoon. Long-time judge on MasterChef India and James Beard Award semifinalist. I guide aspiring food entrepreneurs, restaurateurs, and culinary artists on menu engineering, luxury hospitality branding, and building global culinary businesses.",
    image: "/assets/img/influencers/vikas-khanna-card.jpg",
    topics: ["Creator Access", "SMB Growth", "Enterprise Learning"],
    languages: ["Hindi", "English", "Punjabi"],
    price: 399,
    rating: 4.9,
    replyTime: "10 min",
    reviewsCount: 390,
    sessionsCompleted: "810+ Sessions Completed",
    location: "New York / Amritsar",
    sampleAnswers: [
      {
        question: "What is the biggest operational hurdle when scaling a regional food brand globally?",
        answer: "Preserving cultural authenticity while standardizing consistency. You must deconstruct traditional flavors into repeatable kitchen SOPs without losing the emotional soul of the dish. Sourcing core heritage spices and training staff on storytelling are just as vital as recipe specs."
      },
      {
        question: "How should a first-time restaurateur price their initial menu?",
        answer: "Focus on prime costs (food cost + labor cost), which should generally remain under 60-65% of revenue. Engineer your menu with 'stars' (high-profit, high-popularity) and avoid menu bloat. A tight, focused 20-dish menu executed flawlessly always beats a confusing 80-item catalog."
      }
    ]
  },
  {
    name: "Dhruv Rathee",
    role: "YouTube Educator & Data Analyst | M.Sc Renewable Energy (KIT Germany)",
    desc: "Leading video essayist (25M+ subscribers); guides on research methodology, explanatory storytelling, and video production",
    bio: "Mechanical Engineer with a Master's in Renewable Energy from Karlsruhe Institute of Technology (KIT), Germany. TIME Next Generation Leader and digital educator with over 25 million subscribers. I break down complex socio-economic, environmental, and geopolitical issues into structured, accessible video essays. I advise creators on deep-dive research, data storytelling, and production workflows.",
    image: "/assets/img/influencers/dhruv-rathee-card.jpg",
    topics: ["Creator Access", "Education & Admissions", "SMB Growth"],
    languages: ["Hindi", "English", "German"],
    price: 299,
    rating: 4.8,
    replyTime: "14 min",
    reviewsCount: 450,
    sessionsCompleted: "920+ Sessions Completed",
    location: "Berlin / New Delhi",
    sampleAnswers: [
      {
        question: "How do you structure research for deep-dive explanatory videos so the audience stays hooked?",
        answer: "Start with a primary question that directly affects the viewer's everyday life. Structure your argument like a pyramid: establish undisputed facts first, introduce conflicting data points, and then reveal systemic insights using infographics and primary research papers rather than opinion."
      },
      {
        question: "What is the best way for a new educational creator to stand out in saturated niches?",
        answer: "Clarity over complexity. The creator who can explain a sophisticated macroeconomic or scientific concept using simple analogies, motion graphics, and zero jargon wins every single time."
      }
    ]
  },
  {
    name: "Hitesh Choudhary",
    role: "Tech Educator & Software Architect | Founder, ChaiCode & LearnCodeOnline",
    desc: "Taught millions of developers; mentors on full-stack web dev, system design, and software engineering careers",
    bio: "Programmer, educator, and founder of ChaiCode and LearnCodeOnline (acquired by iNeuron/PW). Having traveled to 45+ countries and taught millions across YouTube and live cohorts, I demystify JavaScript, backend engineering, system design, DevOps, and Generative AI. I mentor developers on cracking tech interviews and building production software.",
    image: "/assets/img/influencers/hitesh-choudhary-card.jpg",
    topics: ["Career & Jobs", "Education & Admissions", "Enterprise Learning"],
    languages: ["Hindi", "English"],
    price: 199,
    rating: 5.0,
    replyTime: "8 min",
    reviewsCount: 520,
    sessionsCompleted: "1100+ Sessions Completed",
    location: "Jaipur, India",
    sampleAnswers: [
      {
        question: "What should a developer build to get hired as a junior/mid-level full stack engineer today?",
        answer: "Stop building clone apps. Build full-stack applications with real-world complexities: auth with refresh tokens, rate limiting, background job queues, webhook integrations, and automated unit/integration tests. Deploy it on cloud infra with CI/CD and document your architecture in the README."
      },
      {
        question: "How should engineers prepare for system design rounds in tech companies?",
        answer: "Focus on fundamentals before buzzwords. Understand caching strategies (Redis), SQL vs NoSQL trade-offs, database indexing, horizontal scaling, load balancers, and message brokers (Kafka/RabbitMQ). Draw end-to-end data flows clearly and calculate back-of-the-envelope estimations."
      }
    ]
  },
  {
    name: "Aakash Chopra",
    role: "Former Indian Test Cricketer | Leading Hindi Cricket Commentator & Author",
    desc: "Ex-India opener & Ranji champion; guides on sports analytics, broadcasting, and high-performance discipline",
    bio: "Former Indian opening batsman with 10,000+ first-class runs and consecutive Ranji Trophy championship captaincy with Rajasthan. Leading cricket commentator across Star Sports, JioCinema, and author of 'Beyond the Blues' and 'Out of the Blue'. I consult on sports journalism, Hindi commentary craft, media analysis, and the discipline required for elite performance under pressure.",
    image: "/assets/img/influencers/aakash-chopra-card.jpg",
    topics: ["Enterprise Learning", "Creator Access", "Career & Jobs"],
    languages: ["Hindi", "English"],
    price: 349,
    rating: 4.9,
    replyTime: "10 min",
    reviewsCount: 340,
    sessionsCompleted: "710+ Sessions Completed",
    location: "Delhi, India",
    sampleAnswers: [
      {
        question: "What does it take to build a career in professional sports broadcasting and commentary?",
        answer: "Command of language, unmatched observation skills, and deep tactical understanding. You aren't just reciting what is happening on screen—the viewer can already see that. Your job is to explain why fielders moved, what the bowler is setting up, and convey the emotional pulse of the game with spontaneous, rich vocabulary."
      },
      {
        question: "How can athletes and high-pressure professionals bounce back after public failures?",
        answer: "Separate your self-worth from performance outcomes. In sports and high-stakes careers, failure is routine data, not a character verdict. Review footage objectively without emotion, make specific technical corrections in training, and keep showing up."
      }
    ]
  }
];

export const featuredExperts: Expert[] = baseExperts.map(withExpertDetails);

export function getAvailableTopics(experts: Expert[]): ExpertiseTag[] {
  const topicSet = new Set(experts.flatMap((expert) => expert.topics));
  return expertiseTags.filter((tag) => topicSet.has(tag));
}

export function getAvailableLanguages(experts: Expert[]): string[] {
  const languageSet = new Set(experts.flatMap((expert) => expert.languages));
  return [...languageSet].sort((a, b) => a.localeCompare(b));
}

export const ratingFilters = [
  { id: "1", label: "1+ stars", minRating: 1 },
  { id: "2", label: "2+ stars", minRating: 2 },
  { id: "3", label: "3+ stars", minRating: 3 },
  { id: "4", label: "4+ stars", minRating: 4 },
  { id: "5", label: "5 stars", minRating: 5 },
] as const;

export type RatingFilterId = (typeof ratingFilters)[number]["id"];

export const priceRangeFilters = [
  { id: "micro", label: "Under ₹150", min: 0, max: 149 },
  { id: "standard", label: "₹150–₹499", min: 150, max: 499 },
  { id: "premium", label: "₹500+", min: 500, max: Infinity },
] as const;

export type PriceRangeFilterId = (typeof priceRangeFilters)[number]["id"];

export const availabilityFilters = [
  { id: "15", label: "Under 15 min", maxMinutes: 15 },
  { id: "30", label: "Under 30 min", maxMinutes: 30 },
  { id: "120", label: "Under 2 hours", maxMinutes: 120 },
] as const;

export type AvailabilityFilterId = (typeof availabilityFilters)[number]["id"];

export function parseReplyTimeMinutes(replyTime: string): number {
  const hourMatch = replyTime.match(/<\s*(\d+)\s*hours?/i);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 60;
  }

  const minMatch = replyTime.match(/(\d+)\s*min/i);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  return Infinity;
}

export function matchesRatingFilter(expert: Expert, filterId: RatingFilterId): boolean {
  const filter = ratingFilters.find((item) => item.id === filterId);
  return filter ? expert.rating >= filter.minRating : true;
}

export function matchesPriceRangeFilter(expert: Expert, filterId: PriceRangeFilterId): boolean {
  const filter = priceRangeFilters.find((item) => item.id === filterId);
  return filter ? expert.price >= filter.min && expert.price <= filter.max : true;
}

export function matchesAvailabilityFilter(
  expert: Expert,
  filterId: AvailabilityFilterId
): boolean {
  const filter = availabilityFilters.find((item) => item.id === filterId);
  return filter ? parseReplyTimeMinutes(expert.replyTime) <= filter.maxMinutes : true;
}

export function expertSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getExpertDetailHref(
  expertOrSlug: Expert | string,
  options?: { seeker?: boolean }
): string {
  const slug =
    typeof expertOrSlug === "string" ? expertOrSlug : expertSlug(expertOrSlug.name);
  return options?.seeker ? `/seeker/expert/${slug}/` : `/expert/${slug}/`;
}

export function getExpertCheckoutHref(
  expertOrSlug: Expert | string,
  type?: string,
  options?: { seeker?: boolean }
): string {
  const slug =
    typeof expertOrSlug === "string" ? expertOrSlug : expertSlug(expertOrSlug.name);
  const basePath = options?.seeker
    ? `/seeker/expert/${slug}/checkout`
    : `/expert/${slug}/checkout`;
  return type ? `${basePath}?type=${type}` : `${basePath}/`;
}

export function formatNameFromSlug(slug: string): string {
  const cleaned = decodeURIComponent(slug).replace(/-/g, " ").trim();
  if (!cleaned) return "Verified Expert";
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getExpertBySlug(slug: string): Expert | undefined {
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const found = featuredExperts.find(
    (expert) =>
      expertSlug(expert.name) === normalized ||
      expertSlug(expert.name) === slug.toLowerCase() ||
      expert.name.toLowerCase() === slug.toLowerCase()
  );
  if (found) return found;

  // Check saved expert applications & draft from localStorage
  if (typeof window !== "undefined") {
    try {
      const rawApps = localStorage.getItem("jatayu_expert_applications");
      if (rawApps) {
        const apps = JSON.parse(rawApps);
        if (Array.isArray(apps)) {
          const match = apps.find(
            (a: Record<string, unknown>) =>
              expertSlug(String(a.name || a.fullName || "")) === normalized ||
              a.appId === slug
          );
          if (match) return normalizeExpert(match as Record<string, unknown>);
        }
      }

      const rawDraft = localStorage.getItem("jatayu_expert_application_draft");
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Record<string, unknown>;
        if (draft && (draft.fullName || draft.categoryLabel || draft.professionalTitle || draft.tagLine || draft.bio)) {
          const draftName = String(draft.fullName || draft.name || formatNameFromSlug(slug));
          const draftSlug = expertSlug(draftName);
          if (draftSlug === normalized || normalized === "aditya-kane" || normalized.length > 0) {
            return normalizeExpert({
              name: draftName,
              fullName: draftName,
              role: draft.professionalTitle || draft.role,
              professionalTitle: draft.professionalTitle,
              category: draft.categoryLabel || draft.category,
              categoryLabel: draft.categoryLabel,
              tagLine: draft.tagLine,
              bio: draft.bio,
              topics: draft.skills || draft.topics,
              price: draft.formatPrices ? Object.values(draft.formatPrices as Record<string, unknown>)[0] : 199,
              formatPrices: draft.formatPrices,
              formats: draft.selectedFormats,
              image: draft.profilePhotoSrc || "/assets/img/team1.png",
            });
          }
        }
      }
    } catch {
      // Ignore local storage error
    }
  }

  if (normalized.length > 0) {
    const dynamicName = formatNameFromSlug(slug);
    return normalizeExpert({
      id: slug,
      fullName: dynamicName,
      name: dynamicName,
    });
  }

  return undefined;
}

export function getExpertById(idOrSlug: string): Expert | undefined {
  const decoded = decodeURIComponent(idOrSlug).trim();
  return getExpertBySlug(decoded);
}

export function getRelatedExperts(expert: Expert, limit = 4): Expert[] {
  const related = featuredExperts.filter(
    (candidate) =>
      candidate.name !== expert.name &&
      candidate.topics.some((topic) => expert.topics.includes(topic))
  );

  if (related.length >= limit) {
    return related.slice(0, limit);
  }

  const fillers = featuredExperts.filter(
    (candidate) =>
      candidate.name !== expert.name && !related.some((item) => item.name === candidate.name)
  );

  return [...related, ...fillers].slice(0, limit);
}

export function normalizeExpert(rawData: Record<string, unknown>): Expert {
  const data = (
    rawData && typeof rawData === "object" && rawData.expert && typeof rawData.expert === "object"
      ? rawData.expert
      : rawData && typeof rawData === "object" && rawData.data && typeof rawData.data === "object"
      ? rawData.data
      : rawData
  ) as Record<string, unknown>;

  const meta = (data.onboardingMetadata && typeof data.onboardingMetadata === "object"
    ? data.onboardingMetadata
    : {}) as Record<string, unknown>;

  const name = String(
    data.name || data.fullName || meta.fullName || meta.name || "Verified Expert"
  ).trim();

  const role = String(
    data.professionalTitle ||
    data.role ||
    meta.professionalTitle ||
    meta.role ||
    ""
  ).trim();

  const tagLine = String(
    data.tagLine || meta.tagLine || data.headline || meta.headline || ""
  ).trim();

  const bioRaw = String(
    data.bio || meta.bio || ""
  ).trim();

  const topicsRaw = Array.isArray(data.topics)
    ? data.topics
    : Array.isArray(data.skills)
    ? data.skills
    : Array.isArray(meta.skills)
    ? meta.skills
    : Array.isArray(data.focusAreas)
    ? data.focusAreas
    : [];

  const topics = topicsRaw.map(String) as ExpertiseTag[];
  const resolvedTopics: ExpertiseTag[] =
    topics.length > 0
      ? topics
      : data.category || meta.category
      ? ([String(data.category || meta.category)] as ExpertiseTag[])
      : [];

  const category =
    typeof data.categoryLabel === "string" && data.categoryLabel.trim()
      ? data.categoryLabel.trim()
      : typeof meta.categoryLabel === "string" && meta.categoryLabel.trim()
      ? meta.categoryLabel.trim()
      : typeof data.category === "string" && data.category.trim()
      ? data.category.trim()
      : typeof meta.category === "string" && meta.category.trim()
      ? meta.category.trim()
      : resolvedTopics[0] || "Consultation";

  const fallbackBio = role
    ? `Expert in ${role}${resolvedTopics.length > 0 ? ` specializing in ${resolvedTopics.join(", ")}` : ""}.`
    : category
    ? `Expert in ${category}.`
    : "Verified Jatayu Expert available for 1:1 consultation sessions.";

  const desc = tagLine.length > 0 ? tagLine : bioRaw.length > 0 ? bioRaw : fallbackBio;
  const bio = bioRaw.length > 0 ? bioRaw : tagLine.length > 0 ? tagLine : fallbackBio;

  const image = String(
    data.image ||
    data.profilePhotoSrc ||
    meta.profilePhotoSrc ||
    data.avatar ||
    "/assets/img/team1.png"
  );

  let parsedFormatPrices: Record<string, unknown> = {};
  const srcPrices = data.formatPrices || meta.formatPrices;
  if (typeof srcPrices === "string" && srcPrices.trim()) {
    try {
      parsedFormatPrices = JSON.parse(srcPrices) as Record<string, unknown>;
    } catch {
      // ignore
    }
  } else if (srcPrices && typeof srcPrices === "object") {
    parsedFormatPrices = srcPrices as Record<string, unknown>;
  }

  let price = 199;
  if (typeof data.price === "number" && !isNaN(data.price)) {
    price = data.price;
  } else if (data.price && !isNaN(Number(data.price))) {
    price = Number(data.price);
  } else if (parsedFormatPrices && Object.keys(parsedFormatPrices).length > 0) {
    const values = Object.values(parsedFormatPrices)
      .map((val) => Number(val))
      .filter((n) => !isNaN(n) && n > 0);
    if (values.length > 0) price = values[0];
  }

  const formatPrices: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(parsedFormatPrices)) {
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      formatPrices[key] = num;
      if (key === "written") {
        formatPrices["text"] = num;
      } else if (key === "text") {
        formatPrices["written"] = num;
      } else if (key === "group") {
        formatPrices["live"] = num;
      } else if (key === "live") {
        formatPrices["group"] = num;
      }
    }
  }

  const rating =
    typeof data.rating === "number" && !isNaN(data.rating)
      ? data.rating
      : data.rating && !isNaN(Number(data.rating))
      ? Number(data.rating)
      : 0;

  const replyTime =
    typeof data.replyTime === "string" && data.replyTime.trim()
      ? data.replyTime.trim()
      : typeof meta.replyTime === "string" && meta.replyTime.trim()
      ? meta.replyTime.trim()
      : "";

  const languagesRaw = Array.isArray(data.languages)
    ? data.languages
    : Array.isArray(meta.languages)
    ? meta.languages
    : Array.isArray(data.focusAreas)
    ? data.focusAreas
    : ["English"];

  const languages = Array.from(new Set(languagesRaw.map(String).filter(Boolean)));

  const location = String(
    data.location ||
    meta.location ||
    data.city ||
    meta.city ||
    "India"
  );

  const primaryTopic = resolvedTopics[0];
  const sampleAnswers = (
    Array.isArray(data.sampleAnswers) && data.sampleAnswers.length > 0
      ? data.sampleAnswers
      : primaryTopic && sampleAnswerByTopic[primaryTopic]
      ? sampleAnswerByTopic[primaryTopic]
      : undefined
  ) as { question: string; answer: string }[] | undefined;

  const reviews = Array.isArray(data.reviews)
    ? (data.reviews as Review[])
    : undefined;

  const reviewsCount =
    typeof data.reviewsCount === "number"
      ? data.reviewsCount
      : reviews
      ? reviews.length
      : undefined;

  const sessionsCompleted =
    typeof data.sessionsCompleted === "string"
      ? data.sessionsCompleted
      : undefined;

  const experienceLevel =
    typeof data.experienceLevel === "string"
      ? data.experienceLevel
      : typeof meta.experienceLevel === "string"
      ? meta.experienceLevel
      : undefined;

  const formatsRaw = Array.isArray(data.formats)
    ? data.formats
    : Array.isArray(data.selectedFormats)
    ? data.selectedFormats
    : Array.isArray(meta.selectedFormats)
    ? meta.selectedFormats
    : ["text", "video", "live"];
  const formats = Array.from(
    new Set(
      formatsRaw.map(String).flatMap((f) => {
        if (f === "written") return ["written", "text"];
        if (f === "text") return ["text", "written"];
        if (f === "group") return ["group", "live"];
        if (f === "live") return ["live", "group"];
        return [f];
      })
    )
  );

  const availabilitiesRaw = Array.isArray(data.availabilities)
    ? data.availabilities
    : Array.isArray(meta.availabilities)
    ? meta.availabilities
    : undefined;

  const availabilities = availabilitiesRaw
    ? (availabilitiesRaw as ExpertAvailability[])
    : undefined;

  return {
    id: typeof data.id === "string" ? data.id : undefined,
    name,
    role,
    desc,
    bio,
    image,
    category,
    topics: resolvedTopics,
    languages: languages.length > 0 ? languages : ["English"],
    price,
    rating,
    replyTime,
    reviewsCount,
    sessionsCompleted,
    experienceLevel,
    location,
    formats,
    formatPrices,
    availabilities,
    timezone: typeof data.timezone === "string" ? data.timezone : undefined,
    matchTier: typeof data.matchTier === "number" ? data.matchTier : undefined,
    sampleAnswers,
    reviews,
  };
}

export function getTopMatchesByCategory(category?: string, limit = 3): Expert[] {
  if (!category) {
    return featuredExperts.slice(0, limit);
  }

  const searchKey = category.toLowerCase().trim();
  const filtered = featuredExperts.filter((exp) => {
    const categoryMatch = exp.category?.toLowerCase().includes(searchKey);
    const topicsString = exp.topics.map((t) => t.toLowerCase()).join(" ");

    if (categoryMatch) return true;
    if (
      searchKey.includes("software") ||
      searchKey.includes("tech") ||
      searchKey.includes("engineering") ||
      searchKey.includes("development")
    ) {
      return topicsString.includes("jobs") || topicsString.includes("career") || topicsString.includes("tech");
    }
    if (
      searchKey.includes("design") ||
      searchKey.includes("ux") ||
      searchKey.includes("ui") ||
      searchKey.includes("creative")
    ) {
      return topicsString.includes("creator") || topicsString.includes("design");
    }
    if (
      searchKey.includes("business") ||
      searchKey.includes("startup") ||
      searchKey.includes("entrepreneur") ||
      searchKey.includes("growth")
    ) {
      return topicsString.includes("startup") || topicsString.includes("smb") || topicsString.includes("fundraising");
    }
    if (searchKey.includes("career") || searchKey.includes("work") || searchKey.includes("job")) {
      return topicsString.includes("career") || topicsString.includes("jobs");
    }
    if (searchKey.includes("marketing") || searchKey.includes("growth")) {
      return topicsString.includes("growth") || topicsString.includes("creator") || topicsString.includes("smb");
    }
    if (
      searchKey.includes("finance") ||
      searchKey.includes("tax") ||
      searchKey.includes("investment")
    ) {
      return topicsString.includes("finance") || topicsString.includes("tax");
    }
    if (searchKey.includes("legal") || searchKey.includes("compliance") || searchKey.includes("contract")) {
      return topicsString.includes("legal");
    }
    if (searchKey.includes("product")) {
      return topicsString.includes("jobs") || topicsString.includes("startup");
    }
    if (searchKey.includes("education") || searchKey.includes("admission") || searchKey.includes("learning")) {
      return topicsString.includes("education") || topicsString.includes("learning");
    }

    return topicsString.includes(searchKey);
  });

  if (filtered.length === 0) {
    return featuredExperts.slice(0, limit);
  }

  return filtered.slice(0, limit);
}

export const consultationOptions = [
  {
    id: "micro",
    priceLabel: "From ₹49",
    title: "Micro-Consultation",
    desc: "Best for quick questions and first-time guidance.",
  },
  {
    id: "standard",
    priceLabel: "From ₹149",
    title: "Standard Consultation",
    desc: "Flexible pricing for detailed advice, planning, and decision support.",
  },
  {
    id: "premium",
    priceLabel: "From ₹499",
    title: "Premium Expert Access",
    desc: "For founders, SMBs, and high-value professional needs.",
  },
] as const;
