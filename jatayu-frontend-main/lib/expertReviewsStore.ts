export type ReviewStatus = "Replied" | "Needs Reply";

export type CategoryScore = {
  label: string;
  score: number;
  maxScore: number;
};

export type AchievementBadge = {
  id: string;
  title: string;
  description: string;
  icon: "star" | "shield" | "zap" | "medal" | "crown" | "lock";
  unlocked: boolean;
};

export type TrendDataPoint = {
  label: string;
  rating: number;
};

export type ReviewItem = {
  id: string;
  clientName: string;
  clientRole: string;
  clientCompany: string;
  avatar: string;
  rating: number;
  date: string;
  sessionTitle: string;
  comment: string;
  tags: string[];
  status: ReviewStatus;
  reply?: {
    date: string;
    text: string;
  };
};

export type RatingSummary = {
  overallRating: number;
  totalReviews: number;
  starDistribution: { stars: number; count: number; percent: number }[];
  recommendationPercent: number;
  responseRatePercent: number;
  avgReplyTimeHours: number;
  badgeLabel: string;
};

export const REVIEWS_SUMMARY: RatingSummary = {
  overallRating: 4.9,
  totalReviews: 34,
  starDistribution: [
    { stars: 5, count: 31, percent: 91 },
    { stars: 4, count: 3, percent: 9 },
    { stars: 3, count: 0, percent: 0 },
    { stars: 2, count: 0, percent: 0 },
    { stars: 1, count: 0, percent: 0 },
  ],
  recommendationPercent: 98,
  responseRatePercent: 96,
  avgReplyTimeHours: 2.1,
  badgeLabel: "TOP 5% EXPERT",
};

export const CATEGORY_SCORES: CategoryScore[] = [
  { label: "Expertise", score: 4.9, maxScore: 5.0 },
  { label: "Communication", score: 4.9, maxScore: 5.0 },
  { label: "Punctuality", score: 5.0, maxScore: 5.0 },
  { label: "Value for Money", score: 4.7, maxScore: 5.0 },
  { label: "Clarity of Guidance", score: 4.8, maxScore: 5.0 },
  { label: "Professionalism", score: 5.0, maxScore: 5.0 },
];

export const FREQUENT_TAGS: string[] = [
  "Insightful",
  "Actionable",
  "Clear",
  "Strategic",
  "Empathetic",
  "Responsive",
  "Thorough",
  "Experienced",
];

export const SIX_MONTH_TREND: TrendDataPoint[] = [
  { label: "Jul", rating: 4.8 },
  { label: "Aug", rating: 4.85 },
  { label: "Sep", rating: 4.9 },
  { label: "Oct", rating: 4.9 },
  { label: "Nov", rating: 4.95 },
  { label: "Dec", rating: 5.0 },
];

export const ONE_YEAR_TREND: TrendDataPoint[] = [
  { label: "Jan", rating: 4.7 },
  { label: "Feb", rating: 4.75 },
  { label: "Mar", rating: 4.8 },
  { label: "Apr", rating: 4.8 },
  { label: "May", rating: 4.85 },
  { label: "Jun", rating: 4.85 },
  { label: "Jul", rating: 4.8 },
  { label: "Aug", rating: 4.85 },
  { label: "Sep", rating: 4.9 },
  { label: "Oct", rating: 4.9 },
  { label: "Nov", rating: 4.95 },
  { label: "Dec", rating: 5.0 },
];

export const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: "b1",
    title: "Top Rated",
    description: "Maintained 4.8+ rating over 20 sessions",
    icon: "star",
    unlocked: true,
  },
  {
    id: "b2",
    title: "Verified",
    description: "Background & identity verified",
    icon: "shield",
    unlocked: true,
  },
  {
    id: "b3",
    title: "Fast Responder",
    description: "Average reply under 3 hours",
    icon: "zap",
    unlocked: true,
  },
  {
    id: "b4",
    title: "30+ Sessions",
    description: "Completed over 30 sessions",
    icon: "medal",
    unlocked: true,
  },
  {
    id: "b5",
    title: "UX Master",
    description: "Specialist badge in Product Strategy",
    icon: "crown",
    unlocked: true,
  },
  {
    id: "b6",
    title: "Legend",
    description: "Unlock at 100 5-star reviews",
    icon: "lock",
    unlocked: false,
  },
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    clientName: "Marcus Williams",
    clientRole: "Head of Product",
    clientCompany: "Nexus Technologies",
    avatar: "/assets/img/avatar2.png",
    rating: 5.0,
    date: "Dec 20, 2024",
    sessionTitle: "Product Strategy Workshop",
    comment:
      "Sarah is an exceptional UX strategist. Her workshop was incredibly actionable and the frameworks she shared were immediately applicable to our product. She understood our challenges within the first 10 minutes and provided tailored recommendations that felt bespoke to our startup context. Highly recommend for any product teams.",
    tags: ["Insightful", "Actionable", "Strategic"],
    status: "Replied",
    reply: {
      date: "Dec 20, 2024",
      text: "Thank you so much, Marcus! It was a genuine pleasure working with your team. Your openness to exploring new frameworks made the session flow really naturally. Wishing you and the team all the best with the product launch — don't hesitate to reach out as you scale!",
    },
  },
  {
    id: "rev-2",
    clientName: "Elena Vasquez",
    clientRole: "UX Design Lead",
    clientCompany: "Aura Creative",
    avatar: "/assets/img/avatar3.png",
    rating: 5.0,
    date: "Dec 14, 2024",
    sessionTitle: "UX Audit & Design Review",
    comment:
      "I came in with a messy UX problem and left with a clear, prioritized roadmap. Sarah's ability to cut through complexity and identify the core user friction points was remarkable. The audit report she delivered was detailed, visually clear, and packed with evidence-based recommendations. Will definitely book again.",
    tags: ["Thorough", "Clear"],
    status: "Needs Reply",
  },
  {
    id: "rev-3",
    clientName: "David Park",
    clientRole: "VP of Engineering",
    clientCompany: "CloudScale Inc",
    avatar: "/assets/img/avatar4.png",
    rating: 4.8,
    date: "Dec 07, 2024",
    sessionTitle: "Architecture & Scale Strategy",
    comment:
      "Very helpful session overall. Sarah gave me a clear framework for approaching my career transition and was encouraging throughout. Would have loved a bit more time to dive deeper into the portfolio review, but the advice on positioning was genuinely valuable. Would definitely recommend.",
    tags: ["Encouraging", "Clear"],
    status: "Replied",
    reply: {
      date: "Dec 07, 2024",
      text: "David, thank you for the honest feedback! You're absolutely right — the portfolio section deserves more time. I'll extend that part in future career sessions. Really glad the positioning framework was useful. Best of luck with the transition — you're more ready than you think!",
    },
  },
  {
    id: "rev-4",
    clientName: "James Carter",
    clientRole: "Founder & CEO",
    clientCompany: "FinVenture",
    avatar: "/assets/img/avatar1.png",
    rating: 5.0,
    date: "Nov 28, 2024",
    sessionTitle: "Brand & Positioning Strategy",
    comment:
      "Working with Sarah on brand strategy was a game-changer for us. Her ability to connect business goals with user psychology is rare. She helped us reframe our positioning from product-first to value-first and the results were immediate. Sessions are engaging, focused, and always end with clear next steps.",
    tags: ["Strategic", "Empathetic", "Engaging"],
    status: "Needs Reply",
  },
  {
    id: "rev-5",
    clientName: "Priya Sharma",
    clientRole: "Design Thinking Director",
    clientCompany: "HealthPulse",
    avatar: "/assets/img/avatar2.png",
    rating: 5.0,
    date: "Nov 20, 2024",
    sessionTitle: "Design Thinking Workshop",
    comment:
      "Absolutely transformative session. Sarah brings a rare blend of empathy and analytical rigour to design thinking. Our entire team left energized with a shared language and framework for approaching user problems. The hands-on exercises were perfectly calibrated for our team's experience level.",
    tags: ["Empathetic", "Insightful", "Engaging"],
    status: "Replied",
    reply: {
      date: "Nov 20, 2024",
      text: "Priya, this was such a powerful experience for me too. Your team's enthusiasm and willingness to reframe problem spaces made the workshop a huge success. I'm thrilled the framework is already yielding results!",
    },
  },
];
