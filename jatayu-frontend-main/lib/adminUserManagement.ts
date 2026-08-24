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
  totalBookings: number;
  totalSpent: number;
  preferredCategory: string;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
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
    totalBookings: 12,
    totalSpent: 18500,
    preferredCategory: "Vedic Astrology",
    status: "active",
    joinedDate: "05 Jan 2025",
    lastActive: "2 hours ago",
  },
  {
    id: "skr-2",
    name: "Meera Nair",
    email: "meera.nair@example.com",
    phone: "+91 97441 55667",
    avatar: "/assets/img/manportrait.png",
    city: "Kochi",
    totalBookings: 6,
    totalSpent: 8200,
    preferredCategory: "Vastu Shastra",
    status: "active",
    joinedDate: "18 Feb 2025",
    lastActive: "1 day ago",
  },
  {
    id: "skr-3",
    name: "Rohan Verma",
    email: "rohan.v@example.com",
    phone: "+91 96550 33445",
    avatar: "/assets/img/manportrait.png",
    city: "Pune",
    totalBookings: 1,
    totalSpent: 1500,
    preferredCategory: "Financial Wellness",
    status: "suspended",
    joinedDate: "10 May 2025",
    lastActive: "3 weeks ago",
  },
  {
    id: "skr-4",
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "+91 99112 44332",
    avatar: "/assets/img/manportrait.png",
    city: "Hyderabad",
    totalBookings: 19,
    totalSpent: 34000,
    preferredCategory: "Numerology & Tarot",
    status: "active",
    joinedDate: "22 Dec 2024",
    lastActive: "Just now",
  },
  {
    id: "skr-5",
    name: "Vikram Shah",
    email: "vikram.shah@example.com",
    phone: "+91 98334 11229",
    avatar: "/assets/img/manportrait.png",
    city: "Ahmedabad",
    totalBookings: 0,
    totalSpent: 0,
    preferredCategory: "Vedic Astrology",
    status: "deleted",
    joinedDate: "15 Mar 2025",
    lastActive: "1 month ago",
  },
  {
    id: "skr-6",
    name: "Ananya Roy",
    email: "ananya.roy@example.com",
    phone: "+91 97112 88990",
    avatar: "/assets/img/manportrait.png",
    city: "Kolkata",
    totalBookings: 3,
    totalSpent: 4500,
    preferredCategory: "Mindfulness & Therapy",
    status: "flagged",
    joinedDate: "02 Apr 2025",
    lastActive: "4 days ago",
  },
];

export function getExpertById(id: string): ExpertUser | undefined {
  return MOCK_EXPERTS.find((exp) => exp.id === id);
}

export function getSeekerById(id: string): SeekerUser | undefined {
  return MOCK_SEEKERS.find((skr) => skr.id === id);
}
