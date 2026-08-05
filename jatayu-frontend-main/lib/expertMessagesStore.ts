export type ChatMessage = {
  id: string;
  senderId: string; // 'expert' or client id
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  dateLabel?: string; // e.g. "December 16, 2024" or "Today, December 17"
};

export type ActiveSessionInfo = {
  projectTitle: string;
  date: string;
  payout: string;
  status: "Confirmed" | "Pending" | "Completed";
};

export type ClientDetails = {
  company: string;
  industry: string;
  timezone: string;
  sessionsCompleted: number;
  totalSpent: string;
};

export type Conversation = {
  id: string;
  clientName: string;
  clientRole: string;
  clientCompany: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  pinned: boolean;
  categoryTag?: string;
  rating: number;
  totalSessions: number;
  activeSession?: ActiveSessionInfo;
  clientDetails: ClientDetails;
  messages: ChatMessage[];
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    clientName: "Marcus Williams",
    clientRole: "Head of Product",
    clientCompany: "Nexus Technologies",
    avatar: "/assets/img/avatar2.png",
    online: true,
    lastMessage: "Great — I'll send over the meeting notes ...",
    lastMessageTime: "10:42 AM",
    unreadCount: 2,
    pinned: true,
    categoryTag: "Product Strategy",
    rating: 4.9,
    totalSessions: 12,
    activeSession: {
      projectTitle: "Product Strategy Workshop",
      date: "Dec 20 · Full Day",
      payout: "$1,080",
      status: "Confirmed",
    },
    clientDetails: {
      company: "Nexus Technologies",
      industry: "SaaS / B2B",
      timezone: "PST (UTC-8)",
      sessionsCompleted: 3,
      totalSpent: "$2,400",
    },
    messages: [
      {
        id: "m1",
        senderId: "client",
        senderName: "Marcus Williams",
        senderAvatar: "/assets/img/avatar2.png",
        text: "Hi Sarah, I've just submitted a new session request for a full-day product strategy workshop. I'm really excited to work with you — I've seen your profile and your methodology is exactly what we need.",
        timestamp: "9:28 AM",
        dateLabel: "December 16, 2024",
      },
      {
        id: "m2",
        senderId: "client",
        senderName: "Marcus Williams",
        senderAvatar: "/assets/img/avatar2.png",
        text: "I've also outlined our core product goals and key market competitors in the session description. Please review before we meet.",
        timestamp: "9:29 AM",
      },
      {
        id: "m3",
        senderId: "expert",
        senderName: "Sarah Mitchell",
        senderAvatar: "/assets/img/avatar1.png",
        text: "Hi Marcus! Thank you for reaching out — your brief looks really well thought through. I've reviewed your request details and I'm confident I can help your team get aligned on a clear Q1 roadmap.",
        timestamp: "9:45 AM",
        status: "read",
      },
      {
        id: "m4",
        senderId: "client",
        senderName: "Marcus Williams",
        senderAvatar: "/assets/img/avatar2.png",
        text: "Brilliant! A few questions: do you prefer starting at 9AM or 10AM PST? And would you be comfortable running exercises in FigJam or do you have a preferred tool?",
        timestamp: "9:48 AM",
        dateLabel: "Today, December 17",
      },
    ],
  },
  {
    id: "conv-2",
    clientName: "Elena Vasquez",
    clientRole: "Design Lead",
    clientCompany: "Aura Creative",
    avatar: "/assets/img/avatar3.png",
    online: true,
    lastMessage: "Could you review the UX notes before...",
    lastMessageTime: "9:15 AM",
    unreadCount: 1,
    pinned: false,
    rating: 4.8,
    totalSessions: 5,
    clientDetails: {
      company: "Aura Creative",
      industry: "Design Agency",
      timezone: "EST (UTC-5)",
      sessionsCompleted: 2,
      totalSpent: "$1,200",
    },
    messages: [
      {
        id: "m20",
        senderId: "client",
        senderName: "Elena Vasquez",
        senderAvatar: "/assets/img/avatar3.png",
        text: "Could you review the UX notes before our session tomorrow morning?",
        timestamp: "9:15 AM",
        dateLabel: "Today, December 17",
      },
    ],
  },
  {
    id: "conv-3",
    clientName: "David Park",
    clientRole: "VP of Engineering",
    clientCompany: "CloudScale Inc",
    avatar: "/assets/img/avatar4.png",
    online: true,
    lastMessage: "Sounds perfect — let's lock in Friday...",
    lastMessageTime: "Yesterday",
    unreadCount: 1,
    pinned: false,
    rating: 5.0,
    totalSessions: 8,
    clientDetails: {
      company: "CloudScale Inc",
      industry: "DevOps & Infrastructure",
      timezone: "CST (UTC-6)",
      sessionsCompleted: 4,
      totalSpent: "$3,600",
    },
    messages: [
      {
        id: "m30",
        senderId: "client",
        senderName: "David Park",
        senderAvatar: "/assets/img/avatar4.png",
        text: "Sounds perfect — let's lock in Friday for our architecture review call.",
        timestamp: "Yesterday",
        dateLabel: "Yesterday",
      },
    ],
  },
  {
    id: "conv-4",
    clientName: "James Carter",
    clientRole: "Founder & CEO",
    clientCompany: "FinVenture",
    avatar: "/assets/img/avatar1.png",
    online: true,
    lastMessage: "Thank you so much, it was a great se...",
    lastMessageTime: "Yesterday",
    unreadCount: 1,
    pinned: false,
    rating: 4.9,
    totalSessions: 3,
    clientDetails: {
      company: "FinVenture",
      industry: "Fintech",
      timezone: "PST (UTC-8)",
      sessionsCompleted: 1,
      totalSpent: "$800",
    },
    messages: [
      {
        id: "m40",
        senderId: "client",
        senderName: "James Carter",
        senderAvatar: "/assets/img/avatar1.png",
        text: "Thank you so much, it was a great session! Sending over the feedback rating now.",
        timestamp: "Yesterday",
        dateLabel: "Yesterday",
      },
    ],
  },
  {
    id: "conv-5",
    clientName: "Priya Nair",
    clientRole: "Senior Product Manager",
    clientCompany: "HealthPulse",
    avatar: "/assets/img/avatar2.png",
    online: true,
    lastMessage: "Looking forward to our session on Monday.",
    lastMessageTime: "Dec 15",
    unreadCount: 0,
    pinned: false,
    rating: 4.7,
    totalSessions: 2,
    clientDetails: {
      company: "HealthPulse",
      industry: "Healthcare Tech",
      timezone: "EST (UTC-5)",
      sessionsCompleted: 1,
      totalSpent: "$500",
    },
    messages: [
      {
        id: "m50",
        senderId: "client",
        senderName: "Priya Nair",
        senderAvatar: "/assets/img/avatar2.png",
        text: "Looking forward to our session on Monday.",
        timestamp: "Dec 15",
        dateLabel: "December 15, 2024",
      },
    ],
  },
  {
    id: "conv-6",
    clientName: "Alex Thompson",
    clientRole: "Growth Lead",
    clientCompany: "MetricLab",
    avatar: "/assets/img/avatar3.png",
    online: false,
    lastMessage: "I've reviewed your proposal and I'm happy...",
    lastMessageTime: "Dec 14",
    unreadCount: 0,
    pinned: false,
    rating: 4.8,
    totalSessions: 6,
    clientDetails: {
      company: "MetricLab",
      industry: "Analytics & Growth",
      timezone: "PST (UTC-8)",
      sessionsCompleted: 3,
      totalSpent: "$2,100",
    },
    messages: [
      {
        id: "m60",
        senderId: "client",
        senderName: "Alex Thompson",
        senderAvatar: "/assets/img/avatar3.png",
        text: "I've reviewed your proposal and I'm happy to proceed. Let's schedule the kickoff.",
        timestamp: "Dec 14",
        dateLabel: "December 14, 2024",
      },
    ],
  },
];

export const QUICK_REPLIES = [
  "Sounds good 👍",
  "Confirm details",
  "Schedule call",
  "Reschedule",
];
