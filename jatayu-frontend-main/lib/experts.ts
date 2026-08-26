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
    name: "Sneha Laxmeshwar",
    role: "Ex-VC Partner at Sequoia | Startup Advisor | 15+ Yrs Exp",
    desc: "VC partner helping founders navigate fundraising and venture capital",
    bio: "I help early-stage founders navigate the complex world of venture capital. With over 15 years of experience on both sides of the table—as a founder who raised $20M+ and as a VC partner who deployed over $100M—I know exactly what investors are looking for. Whether you need help tearing down your pitch deck, structuring your seed round, or negotiating a term sheet, I provide actionable, no-nonsense advice.",
    image: "/assets/img/team1.png",
    topics: ["Legal & Compliance", "Startup & Fundraising", "Career & Jobs", "Tax & Finance"],
    languages: ["Hindi", "English"],
    price: 2500,
    rating: 4.9,
    replyTime: "< 2 hours",
    reviewsCount: 120,
    sessionsCompleted: "350+ Sessions Completed",
    location: "Mumbai, India",
    sampleAnswers: [
      {
        question: "How should i value my pre-revenue saas startup for a seed round?",
        answer: "Pre-revenue valuation is more art than science. Don't focus on DCF models; investors won't believe them anyway. Instead, look at the market standard for your geography and sector. In India right now, a standard seed round for a high-quality SaaS team ranges from $1M to $2M at a $6M to $10M post-money valuation. Focus on dilution: aim to give up 15-20% of your company in your seed round, and back-calculate your valuation from the amount you actually need to raise to reach 18-24 months of runway."
      },
      {
        question: "What is the biggest mistake founders make during term sheet negotiation?",
        answer: "Focusing too much on valuation and ignoring control clauses. A high valuation with demanding liquidation preferences, board veto rights, or anti-dilution clauses can hurt you more than a slightly lower valuation with clean, founder-friendly terms. Keep control in your hands during the early rounds."
      }
    ],
    reviews: [
      {
        userName: "Neha K.",
        userAvatar: "/assets/img/avatar1.png",
        consultationType: "Live Call",
        dateString: "2 days ago",
        rating: 5,
        text: "Vikram's advice on our pitch deck was game-changing. He pointed out exactly what VCs would push back on and helped us reframe our narrative. Highly recommend for any early-stage founder."
      },
      {
        userName: "Rahul M.",
        userAvatar: "",
        consultationType: "Text Consultation",
        dateString: "1 week ago",
        rating: 5,
        text: "Very detailed and actionable response to my questions about term sheet clauses. Saved us from making a critical mistake with liquidation preferences."
      },
      {
        userName: "Neha K.",
        userAvatar: "/assets/img/avatar1.png",
        consultationType: "Live Call",
        dateString: "2 days ago",
        rating: 5,
        text: "Vikram's advice on our pitch deck was game-changing. He pointed out exactly what VCs would push back on and helped us reframe our narrative. Highly recommend for any early-stage founder."
      },
      {
        userName: "Rahul M.",
        userAvatar: "",
        consultationType: "Text Consultation",
        dateString: "1 week ago",
        rating: 5,
        text: "Very detailed and actionable response to my questions about term sheet clauses. Saved us from making a critical mistake with liquidation preferences."
      }
    ]
  },
  {
    name: "Dylan Brooks",
    role: "From 49",
    desc: "Product career mentor for PM interviews and salary negotiation",
    bio: "I help aspiring and mid-career product managers land roles at top tech companies and optimize their compensation packages. With a decade of PM experience at companies like Google and Flipkart, I guide you through product design, strategy, and metric interviews. Let's practice mock interviews, refine your resume, and negotiate your next offer.",
    image: "/assets/img/team1.png",
    topics: ["Career & Jobs"],
    languages: ["English", "Hindi", "Marathi"],
    price: 149,
    rating: 4.8,
    replyTime: "14 min"
  },
  {
    name: "Lila Anderson",
    role: "Framer Developer",
    desc: "Expert admissions advisor for masters applications and scholarship essays",
    bio: "I assist students in crafting compelling Master's and PhD applications for top global universities. Drawing on my background as an admissions officer and essay coach, I help you identify your unique narrative, polish your statement of purpose, and draft standout letters of recommendation. Let's maximize your chances to secure funding and scholarships.",
    image: "/assets/img/team2.png",
    topics: ["Education & Admissions"],
    languages: ["English", "Tamil", "Telugu"],
    price: 199,
    rating: 4.9,
    replyTime: "10 min"
  },
  {
    name: "Harper Collins",
    role: "CEO & Art Director",
    desc: "CA for GST filings, creator income, and tax planning",
    bio: "I specialize in tax advisory and compliance for creators, digital freelancers, and high-growth direct-to-consumer (D2C) brands. From setting up GST registration to optimizing multi-state supply chain tax planning and structuring foreign income remittance, I demystify complex tax laws. Get clear, actionable strategies to minimize liabilities and ensure complete audit readiness.",
    image: "/assets/img/team3.png",
    topics: ["Tax & Finance"],
    languages: ["English", "Kannada", "Hindi"],
    price: 299,
    rating: 4.7,
    replyTime: "20 min"
  },
  {
    name: "Mason Turner",
    role: "Motion & UI Designer",
    desc: "Startup lawyer for founder agreements, ESOPs, and SaaS contracts",
    bio: "I advise early-stage startup founders on corporate law, legal structuring, and IP protection. Having drafted hundreds of founder agreements, ESOP pools, commercial SaaS agreements, and terms of service, I focus on protecting your interests without slowing down your business velocity. Let's ensure your startup is legally robust and investor-ready from day one.",
    image: "/assets/img/team4.png",
    topics: ["Legal & Compliance"],
    languages: ["English", "Hindi", "Gujarati"],
    price: 249,
    rating: 4.6,
    replyTime: "15 min"
  },
  {
    name: "Nora Bennett",
    role: "Growth Strategist",
    desc: "Helps D2C founders build retention and scale paid acquisition",
    bio: "I partner with early and growth-stage consumer brands to optimize customer acquisition cost (CAC) and drive long-term customer lifetime value (LTV). Through data-driven marketing audits, cohort retention strategies, and performance marketing optimization across Meta and Google, I help you build sustainable growth loops that scale. Stop burning cash and start scaling profitably.",
    image: "/assets/img/team1.png",
    topics: ["Startup & Fundraising", "SMB Growth"],
    languages: ["English", "Bengali"],
    price: 199,
    rating: 4.8,
    replyTime: "12 min"
  },
  {
    name: "Ethan Clarke",
    role: "Career Coach",
    desc: "Guides professionals with resume rewrites and interview game plans",
    bio: "I help ambitious professionals navigate career transitions, pivot into new industries, and break through growth plateaus. My coaching covers end-to-end career strategy: from rewriting executive resumes to optimizing LinkedIn presence for headhunters, building networking confidence, and mastering situational behavioral interviews. Let's design a customized roadmap for your next big move.",
    image: "/assets/img/team2.png",
    topics: ["Career & Jobs"],
    languages: ["English", "Malayalam", "Hindi"],
    price: 99,
    rating: 4.5,
    replyTime: "25 min"
  },
  {
    name: "Amelia Hayes",
    role: "Finance Advisor",
    desc: "Supports founders with runway planning, pricing, and investor decks",
    bio: "I act as a fractional CFO for high-growth startups, specializing in financial modeling, unit economics, and runway management. I help founders construct robust three-statement financial projections, optimize SaaS pricing structures, and translate complex financial metrics into pitch-deck-ready narratives that build investor trust. Let's align your financials with your strategic roadmap.",
    image: "/assets/img/team3.png",
    topics: ["Startup & Fundraising", "Tax & Finance"],
    languages: ["English", "Marathi", "Gujarati"],
    price: 299,
    rating: 4.8,
    replyTime: "8 min"
  },
  {
    name: "Lucas Perry",
    role: "Admissions Mentor",
    desc: "Builds strong SOPs, profile strategy, and college application timelines",
    bio: "I help high school and undergraduate students build winning profiles for top-tier university applications. From selecting the right extracurricular strategies to aligning application timelines, drafting impactful personal statements, and prepping for competitive college interviews, I demystify the admissions puzzle. Let's structure a plan that makes your application impossible to ignore.",
    image: "/assets/img/team4.png",
    topics: ["Education & Admissions"],
    languages: ["English", "Hindi", "Odia"],
    price: 149,
    rating: 4.7,
    replyTime: "18 min"
  },
  {
    name: "Olivia Reed",
    role: "Compliance Specialist",
    desc: "Advises on GST, contracts, and compliance for growing teams",
    bio: "I guide corporate teams and growing small businesses through the complex landscape of regulatory compliance and corporate governance. From managing GST audits to advising on FDI reporting, corporate secretarial filings, and labor law compliance, I protect your business from expensive fines. Let's clean up your compliance backlog and build a risk-free operational setup.",
    image: "/assets/img/team1.png",
    topics: ["Legal & Compliance", "Tax & Finance"],
    languages: ["English", "Punjabi", "Hindi"],
    price: 249,
    rating: 4.9,
    replyTime: "11 min"
  },
  {
    name: "Noah Wilson",
    role: "Tax Consultant",
    desc: "Optimizes tax structures for creators, freelancers, and early startups",
    bio: "I provide strategic tax planning and structural advice for independent professionals, creators, and early-stage startups. I specialize in maximizing tax deductions, structuring intellectual property licensing, and managing double taxation compliance for international clients. Let's review your income streams and structure a custom plan that keeps more money in your business.",
    image: "/assets/img/team2.png",
    topics: ["Tax & Finance"],
    languages: ["English", "Telugu", "Hindi"],
    price: 199,
    rating: 4.6,
    replyTime: "16 min"
  },
  {
    name: "Ava Simmons",
    role: "Creator Partner Manager",
    desc: "Connects content creators to brand opportunities and monetization plans",
    bio: "I bridge the gap between digital content creators and top consumer brands looking for authentic partnerships. With years of experience managing influencer campaigns and negotiating brand deals, I help creators price their content, pitch to dream brands, and build diversified, long-term monetization channels beyond ad revenue. Let's turn your audience into a sustainable business.",
    image: "/assets/img/team3.png",
    topics: ["Creator Access"],
    languages: ["English", "Kannada", "Tamil"],
    price: 149,
    rating: 4.7,
    replyTime: "22 min"
  },
  {
    name: "James Carter",
    role: "L&D Consultant",
    desc: "Designs enterprise upskilling programs with clear and measurable outcomes",
    bio: "I consult with corporate HR and leadership teams to design and implement impactful Learning & Development (L&D) frameworks. By aligning employee training programs with key business objectives and metrics, I ensure your talent development efforts yield measurable improvements in productivity and employee retention. Let's build a culture of continuous growth.",
    image: "/assets/img/team4.png",
    topics: ["Enterprise Learning"],
    languages: ["English", "Hindi", "Marathi"],
    price: 399,
    rating: 4.8,
    replyTime: "15 min"
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
