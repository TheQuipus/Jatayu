export type UserStatus = "active" | "on_hold" | "suspended" | "pending" | "deleted" | "flagged";

export type ExpertUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  category: string;
  subCategory: string;
  rating: number;
  reviewCount: number;
  reviewsCount: number;
  totalSessions: number;
  completedSessions: number;
  totalEarnings: number;
  hourlyRate: number;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
  city: string;
  location: string;
  bio: string;
};

export type SeekerUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  city: string;
  location?: string;
  totalBookings: number;
  totalSpent: number;
  preferredCategory: string;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
  // Seeker Onboarding Fields
  category?: string;
  topics?: string[];
  needsSubject?: string;
  needsText?: string;
  needChips?: string[];
  formats?: string[];
  budgetTier?: string;
  budgetRange?: string;
  languages?: string[];
  additionalContext?: string;
  onboardingStep?: string;
  onboardingComplete?: boolean;
  agreedToTerms?: boolean;
  profileBio?: string;
  walletBalance?: number;
};

export const ADMIN_USERS_EXPERTS_HREF = "/admin/users/experts";
export const ADMIN_USERS_SEEKERS_HREF = "/admin/users/seekers";

export const MOCK_EXPERTS: ExpertUser[] = [
  {
    id: "exp-1",
    name: "Dr. Ananya Sharma",
    email: "ananya.sharma@example.com",
    phone: "+91 98765 43210",
    avatar: "/assets/img/manportrait.png",
    category: "Vedic Astrology",
    subCategory: "Kundali & Prashna",
    rating: 4.9,
    reviewCount: 142,
    reviewsCount: 142,
    totalSessions: 380,
    completedSessions: 380,
    totalEarnings: 245000,
    hourlyRate: 1200,
    status: "active",
    joinedDate: "12 Jan 2025",
    lastActive: "10 mins ago",
    city: "New Delhi",
    location: "New Delhi, NCR",
    bio: "Over 15 years of experience in Vedic astrology, horoscope analysis, and birth chart reading.",
  },
  {
    id: "exp-2",
    name: "Rajesh Kumar Vastu",
    email: "rajesh.vastu@example.com",
    phone: "+91 98123 88765",
    avatar: "/assets/img/manportrait.png",
    category: "Vastu Shastra",
    subCategory: "Commercial & Residential",
    rating: 4.8,
    reviewCount: 98,
    reviewsCount: 98,
    totalSessions: 215,
    completedSessions: 215,
    totalEarnings: 178000,
    hourlyRate: 1500,
    status: "active",
    joinedDate: "28 Feb 2025",
    lastActive: "3 hours ago",
    city: "Mumbai",
    location: "Mumbai, Maharashtra",
    bio: "Certified Vastu consultant helping households and businesses align their energy flows for success.",
  },
  {
    id: "exp-3",
    name: "Kavita Iyer",
    email: "kavita.iyer@example.com",
    phone: "+91 97654 32109",
    avatar: "/assets/img/manportrait.png",
    category: "Numerology & Tarot",
    subCategory: "Tarot Card Reading",
    rating: 4.7,
    reviewCount: 64,
    reviewsCount: 64,
    totalSessions: 120,
    completedSessions: 120,
    totalEarnings: 95000,
    hourlyRate: 900,
    status: "on_hold",
    joinedDate: "15 Apr 2025",
    lastActive: "2 days ago",
    city: "Bengaluru",
    location: "Bengaluru, Karnataka",
    bio: "Specializing in career guidance, personal relationships, and intuitive Tarot card readings.",
  },
  {
    id: "exp-4",
    name: "Vikram Malhotra",
    email: "vikram.m@example.com",
    phone: "+91 99887 66554",
    avatar: "/assets/img/manportrait.png",
    category: "Financial Wellness",
    subCategory: "Personal Finance",
    rating: 4.5,
    reviewCount: 32,
    reviewsCount: 32,
    totalSessions: 54,
    completedSessions: 54,
    totalEarnings: 42000,
    hourlyRate: 1100,
    status: "suspended",
    joinedDate: "03 Jun 2025",
    lastActive: "1 week ago",
    city: "Gurugram",
    location: "Gurugram, Haryana",
    bio: "Financial planner assisting individuals with tax planning, investment portfolios, and savings.",
  },
  {
    id: "exp-5",
    name: "Priya Sundaram",
    email: "priya.sundaram@example.com",
    phone: "+91 91234 56789",
    avatar: "/assets/img/manportrait.png",
    category: "Mindfulness & Therapy",
    subCategory: "Stress Management",
    rating: 5.0,
    reviewCount: 89,
    reviewsCount: 89,
    totalSessions: 190,
    completedSessions: 190,
    totalEarnings: 160000,
    hourlyRate: 1000,
    status: "active",
    joinedDate: "19 Mar 2025",
    lastActive: "Just now",
    city: "Chennai",
    location: "Chennai, Tamil Nadu",
    bio: "Holistic mindfulness coach and meditation practitioner focusing on emotional balance.",
  },
];

export const MOCK_SEEKERS: SeekerUser[] = [
  {
    id: "skr-1",
    name: "Aarav Gupta",
    email: "aarav.g@example.com",
    phone: "+91 98220 11223",
    avatar: "/assets/img/manportrait.png",
    city: "New Delhi",
    location: "New Delhi, NCR, India",
    totalBookings: 12,
    totalSpent: 18500,
    preferredCategory: "Career & Work",
    category: "Career & Work",
    topics: ["Job Interview Prep", "Salary Negotiation", "Career Pivot", "Leadership Skills"],
    needsSubject: "VP Product Career Pivot & Executive Compensation",
    needsText: "Transitioning from Principal Engineering into Director of Product. Need executive mock interviews, negotiation strategy for stock equity grants, and 90-day leadership roadmap.",
    needChips: ["Clarity & Direction", "Actionable Roadmap", "Second Opinion", "Avoid Costly Mistakes"],
    formats: ["1:1 Video Call", "Text Messaging"],
    budgetTier: "Standard",
    budgetRange: "₹2,500–₹8,000/min",
    languages: ["English", "Hindi", "Punjabi"],
    additionalContext: "Looking for mentors with executive leadership experience in Tier-1 hyper-growth tech startups.",
    status: "active",
    joinedDate: "05 Jan 2025",
    lastActive: "2 hours ago",
    onboardingComplete: true,
    onboardingStep: "completed",
    agreedToTerms: true,
    profileBio: "Tech lead transitioning into product executive leadership. Focused on high-scale systems and product-led growth.",
    walletBalance: 2450,
  },
  {
    id: "skr-2",
    name: "Meera Nair",
    email: "meera.nair@example.com",
    phone: "+91 97441 55667",
    avatar: "/assets/img/manportrait.png",
    city: "Kochi",
    location: "Kochi, Kerala, India",
    totalBookings: 6,
    totalSpent: 8200,
    preferredCategory: "Business & Entrepreneurship",
    category: "Business & Entrepreneurship",
    topics: ["Go-to-market planning", "Fundraising", "Pricing strategy", "Growth planning"],
    needsSubject: "B2B SaaS Go-To-Market & Pre-Seed Pitch Deck",
    needsText: "Launching an enterprise ESG compliance platform. Need expert feedback on pricing tiers, enterprise buyer personas, and pre-seed institutional investor pitch deck.",
    needChips: ["Actionable Roadmap", "Clarity & Direction", "Expert Solution"],
    formats: ["1:1 Video Call", "Live Chat"],
    budgetTier: "Premium",
    budgetRange: "₹8,000–₹20,000/min",
    languages: ["English", "Malayalam", "Tamil"],
    additionalContext: "Prefer advisors with previous B2B SaaS venture backing in Southeast Asia / India corridor.",
    status: "active",
    joinedDate: "18 Feb 2025",
    lastActive: "1 day ago",
    onboardingComplete: true,
    onboardingStep: "completed",
    agreedToTerms: true,
    profileBio: "Founder building sustainable enterprise B2B compliance software. Alum of IIT Madras.",
    walletBalance: 4800,
  },
  {
    id: "skr-3",
    name: "Rohan Verma",
    email: "rohan.v@example.com",
    phone: "+91 96550 33445",
    avatar: "/assets/img/manportrait.png",
    city: "Pune",
    location: "Pune, Maharashtra, India",
    totalBookings: 1,
    totalSpent: 1500,
    preferredCategory: "Finance & Investment",
    category: "Finance & Investment",
    topics: ["Tax Advisory & GST", "VC Fundraising", "Financial Modeling"],
    needsSubject: "ESOP Structuring & Cross-Border Tax Advisory",
    needsText: "Setting up an Indian subsidiary with US holding company structure. Looking for tax guidance and ESOP pool allocation for early founding engineers.",
    needChips: ["Avoid Costly Mistakes", "Second Opinion", "Clarity & Direction"],
    formats: ["1:1 Video Call", "Document Review"],
    budgetTier: "Standard",
    budgetRange: "₹2,500–₹8,000/min",
    languages: ["English", "Hindi", "Marathi"],
    additionalContext: "Seeking Chartered Accountants or CFO advisors familiar with Delaware-C Corp flip.",
    status: "suspended",
    joinedDate: "10 May 2025",
    lastActive: "3 weeks ago",
    onboardingComplete: true,
    onboardingStep: "completed",
    agreedToTerms: true,
    profileBio: "Early-stage startup co-founder managing financial compliance and treasury.",
    walletBalance: 150,
  },
  {
    id: "skr-4",
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "+91 99112 44332",
    avatar: "/assets/img/manportrait.png",
    city: "Hyderabad",
    location: "Hyderabad, Telangana, India",
    totalBookings: 19,
    totalSpent: 34000,
    preferredCategory: "Legal & Compliance",
    category: "Legal & Compliance",
    topics: ["Founder Agreements", "Data Privacy (GDPR)", "IP & Patents", "SaaS Contracts"],
    needsSubject: "Enterprise SaaS SLA & IP Assignment Master Agreements",
    needsText: "Reviewing vendor agreements and liability indemnification clauses for US healthcare clients requiring HIPAA & SOC-2 alignment.",
    needChips: ["Expert Solution", "Avoid Costly Mistakes", "Second Opinion"],
    formats: ["1:1 Video Call", "Text Messaging", "Live Chat"],
    budgetTier: "Elite",
    budgetRange: "₹20,000+/min",
    languages: ["English", "Telugu", "Hindi"],
    additionalContext: "Prefer corporate attorneys with cross-border technology licensing expertise.",
    status: "active",
    joinedDate: "22 Dec 2024",
    lastActive: "Just now",
    onboardingComplete: true,
    onboardingStep: "completed",
    agreedToTerms: true,
    profileBio: "Chief Operations Officer leading health-tech scaleup with international clients.",
    walletBalance: 6200,
  },
  {
    id: "skr-5",
    name: "Vikram Shah",
    email: "vikram.shah@example.com",
    phone: "+91 98334 11229",
    avatar: "/assets/img/manportrait.png",
    city: "Ahmedabad",
    location: "Ahmedabad, Gujarat, India",
    totalBookings: 0,
    totalSpent: 0,
    preferredCategory: "Design & Creative",
    category: "Design & Creative",
    topics: ["Design Systems", "UI / UX Design", "User Research", "Motion Design"],
    needsSubject: "Design System Architecture & Multi-Brand Tokens",
    needsText: "Building a unified Figma token structure for fintech mobile and web products. Need guidance from Design Directors on governance and component lifecycle.",
    needChips: ["Clarity & Direction", "Actionable Roadmap"],
    formats: ["1:1 Video Call"],
    budgetTier: "Budget-Friendly",
    budgetRange: "₹49–₹2,500/min",
    languages: ["English", "Gujarati", "Hindi"],
    additionalContext: "Prefers evening sessions after 7 PM IST.",
    status: "deleted",
    joinedDate: "15 Mar 2025",
    lastActive: "1 month ago",
    onboardingComplete: false,
    onboardingStep: "budget",
    agreedToTerms: false,
    profileBio: "Senior Product Designer building next-generation digital banking experiences.",
    walletBalance: 0,
  },
  {
    id: "skr-6",
    name: "Ananya Roy",
    email: "ananya.roy@example.com",
    phone: "+91 97112 88990",
    avatar: "/assets/img/manportrait.png",
    city: "Kolkata",
    location: "Kolkata, West Bengal, India",
    totalBookings: 3,
    totalSpent: 4500,
    preferredCategory: "Personal Growth",
    category: "Personal Growth",
    topics: ["Executive Coaching", "Public Speaking", "Work-Life Balance", "Time Management"],
    needsSubject: "Executive Presence & Keynote Delivery Coaching",
    needsText: "Delivering upcoming keynote at regional tech conference. Need coaching on vocal modulation, storytelling structure, and managing executive stage anxiety.",
    needChips: ["Clarity & Direction", "Support & Guidance", "Actionable Roadmap"],
    formats: ["1:1 Video Call", "Shoutout"],
    budgetTier: "Standard",
    budgetRange: "₹2,500–₹8,000/min",
    languages: ["English", "Bengali", "Hindi"],
    additionalContext: "Looking for coaches who have trained TEDx speakers.",
    status: "flagged",
    joinedDate: "02 Apr 2025",
    lastActive: "4 days ago",
    onboardingComplete: true,
    onboardingStep: "completed",
    agreedToTerms: true,
    profileBio: "VP of Marketing at D2C brand preparing for international expansion conferences.",
    walletBalance: 1200,
  },
];

export function getExpertById(id: string): ExpertUser | undefined {
  return MOCK_EXPERTS.find((exp) => exp.id === id);
}

export function getSeekerById(id: string): SeekerUser | undefined {
  return MOCK_SEEKERS.find((skr) => skr.id === id);
}
