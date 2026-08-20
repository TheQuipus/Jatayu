export type RequestStatus = "new" | "pending" | "accepted" | "declined";

export type ClientRequest = {
  id: string;
  clientName: string;
  clientAvatar: string;
  title: string;
  description: string;
  status: RequestStatus;
  urgent?: boolean;
  repeatClient?: boolean;
  isPoked?: boolean;
  pokeCount?: number;
  price: number;
  timeAgo: string;
  dateLabel: string;
  durationLabel: string;
  formatLabel: string;
  createdAt: number;
  declineReason?: string;
  declineNotes?: string;
  expertProfessionalTitle?: string;
  rawItem?: Record<string, unknown>;
};

export type RequestStatusFilter = "all" | "urgent" | RequestStatus;

export type RequestSort = "newest" | "oldest";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

export const INITIAL_CLIENT_REQUESTS: ClientRequest[] = [
  {
    id: "req-1",
    clientName: "Marcus Williams",
    clientAvatar: "/assets/img/avatar2.png",
    title: "Product Strategy Workshop — Full Day",
    description:
      "I'm looking for a senior UX strategist to help my team redefine our product vision. We have a product review in 2 weeks and need a focused strategy workshop session...",
    status: "new",
    urgent: true,
    price: 12000,
    timeAgo: "32 min ago",
    dateLabel: "Dec 20, 2024",
    durationLabel: "09:00 AM - 05:00 PM",
    formatLabel: "Video call",
    createdAt: Date.now() - 32 * 60 * 1000,
  },
  {
    id: "req-2",
    clientName: "Elena Vasquez",
    clientAvatar: "/assets/img/avatar3.png",
    title: "UX Audit — SaaS Platform Redesign",
    description:
      "We've recently shipped a new version of our dashboard and users are reporting confusion with the navigation. Looking for a thorough UX audit with actionable recommendations...",
    status: "new",
    price: 5800,
    timeAgo: "1 hr ago",
    dateLabel: "Jan 12, 2025",
    durationLabel: "10:00 AM - 12:00 PM",
    formatLabel: "Async + live",
    createdAt: Date.now() - 60 * 60 * 1000,
  },
  {
    id: "req-3",
    clientName: "David Park",
    clientAvatar: "/assets/img/avatar4.png",
    title: "Design Systems Consultation — 4-week Engagement",
    description:
      "Following up on our previous session. Ready to move forward with the full design system buildout. Looking to engage for approximately 4 weeks, 2 sessions per week...",
    status: "new",
    repeatClient: true,
    price: 32000,
    timeAgo: "3 hrs ago",
    dateLabel: "Jan 06, 2025",
    durationLabel: "02:00 PM - 04:00 PM",
    formatLabel: "Video call",
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: "req-4",
    clientName: "Priya Sharma",
    clientAvatar: "/assets/img/avatar1.png",
    title: "D2C Growth Strategy Session",
    description:
      "Running a D2C skincare brand and need expert guidance on scaling paid acquisition while improving retention. Looking for actionable frameworks we can implement immediately.",
    status: "pending",
    isPoked: true,
    pokeCount: 1,
    price: 8500,
    timeAgo: "1d ago",
    dateLabel: "Dec 28, 2024",
    durationLabel: "03:00 PM - 04:00 PM",
    formatLabel: "Video call",
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    id: "req-5",
    clientName: "Arjun Patel",
    clientAvatar: "/assets/img/avatar2.png",
    title: "Team OKR Framework Setup",
    description:
      "Growing from 15 to 40 people and need help implementing an OKR framework that works for a hybrid product-engineering org.",
    status: "pending",
    isPoked: true,
    pokeCount: 1,
    price: 15000,
    timeAgo: "1d ago",
    dateLabel: "Jan 05, 2025",
    durationLabel: "11:00 AM - 01:00 PM",
    formatLabel: "Video call",
    createdAt: Date.now() - 26 * 60 * 60 * 1000,
  },
  {
    id: "req-6",
    clientName: "Sophia Chen",
    clientAvatar: "/assets/img/avatar3.png",
    title: "AI & ML Architecture Advisory",
    description:
      "Building an LLM-powered enterprise search platform. Seeking guidance on vector DB indexing, chunking strategies, and latency reduction.",
    status: "accepted",
    price: 24000,
    timeAgo: "2d ago",
    dateLabel: "Tomorrow at 02:00 PM",
    durationLabel: "02:00 PM - 04:00 PM",
    formatLabel: "Video call",
    createdAt: Date.now() - 48 * 60 * 60 * 1000,
  },
  {
    id: "req-7",
    clientName: "Liam O'Connor",
    clientAvatar: "/assets/img/avatar4.png",
    title: "Mobile App Scaling & Performance Review",
    description:
      "React Native application experiencing render lag on low-tier Android devices. Seeking a deep performance audit and optimization plan.",
    status: "accepted",
    repeatClient: true,
    price: 18000,
    timeAgo: "3d ago",
    dateLabel: "Dec 24, 2024",
    durationLabel: "10:00 AM - 11:30 AM",
    formatLabel: "Video call",
    createdAt: Date.now() - 72 * 60 * 60 * 1000,
  },
  {
    id: "req-8",
    clientName: "Carlos Rodriguez",
    clientAvatar: "/assets/img/avatar1.png",
    title: "Web3 Protocol Security Audit",
    description:
      "Requesting a full smart contract audit and tokenomics review for an upcoming DeFi protocol launch.",
    status: "declined",
    price: 45000,
    timeAgo: "4d ago",
    dateLabel: "Dec 15, 2024",
    durationLabel: "01:00 PM - 05:00 PM",
    formatLabel: "Async + live",
    createdAt: Date.now() - 96 * 60 * 60 * 1000,
    declineReason: "Out of Scope / Outside Expertise",
  },
  {
    id: "req-9",
    clientName: "Meera Nair",
    clientAvatar: "/assets/img/avatar2.png",
    title: "Full-Time Interim CTO Role",
    description:
      "Looking for an interim CTO to commit 40 hours/week for 6 months. Seeking immediate availability.",
    status: "declined",
    price: 90000,
    timeAgo: "5d ago",
    dateLabel: "Dec 10, 2024",
    durationLabel: "Full-time",
    formatLabel: "On-site / Hybrid",
    createdAt: Date.now() - 120 * 60 * 60 * 1000,
    declineReason: "Scheduling Conflict / Not Available",
  },
];

export const CLIENT_REQUESTS = INITIAL_CLIENT_REQUESTS;

// Module in-memory state (resets automatically on page refresh)
let inMemoryRequests: ClientRequest[] | null = null;

export function getStoredRequests(): ClientRequest[] {
  if (!inMemoryRequests) {
    inMemoryRequests = JSON.parse(JSON.stringify(INITIAL_CLIENT_REQUESTS));
  }
  return inMemoryRequests!;
}

export function saveStoredRequests(requests: ClientRequest[]): void {
  inMemoryRequests = requests;
}

export function updateStoredRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  declineReason?: string,
  declineNotes?: string
): ClientRequest[] {
  const current = getStoredRequests();
  const updated = current.map((req) => {
    if (req.id === requestId) {
      return {
        ...req,
        status: newStatus,
        ...(declineReason ? { declineReason } : {}),
        ...(declineNotes ? { declineNotes } : {}),
      };
    }
    return req;
  });
  saveStoredRequests(updated);
  return updated;
}

export function getRequestCounts(requestsList?: ClientRequest[]) {
  const list = requestsList || getStoredRequests();
  return {
    all: list.length,
    new: list.filter((r) => r.status === "new").length,
    pending: list.filter((r) => r.status === "pending").length,
    accepted: list.filter((r) => r.status === "accepted").length,
    declined: list.filter((r) => r.status === "declined").length,
  };
}

export function formatRequestPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function isRequestPoked(request: ClientRequest): boolean {
  if (request.isPoked) return true;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(`poke_state_${request.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.count && parsed.count > 0) return true;
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return false;
}

export type FetchExpertRequestsParams = {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export async function fetchExpertRequests(params: FetchExpertRequestsParams = {}) {
  const { getExpertRequests } = await import("@/lib/api");

  try {
    const response = await getExpertRequests({
      status: params.status || "all",
      page: params.page || 1,
      limit: params.limit || 20,
      sort: params.sort || "newest",
    });

    saveStoredRequests(response.requests);
    return response;
  } catch {
    // Fallback to local stored requests if API is unreachable
    const allStored = getStoredRequests();
    const statusFilter = params.status || "all";
    const page = params.page || 1;
    const limit = params.limit || 20;
    const sort = params.sort || "newest";

    let filtered =
      statusFilter === "all"
        ? [...allStored]
        : statusFilter === "urgent"
        ? allStored.filter((r) => Boolean(r.urgent))
        : allStored.filter((r) => r.status === statusFilter);

    if (sort === "oldest") {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedRequests = filtered.slice(startIndex, startIndex + limit);

    return {
      requests: paginatedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      counts: {
        all: allStored.length,
        urgent: allStored.filter((r) => Boolean(r.urgent)).length,
        new: allStored.filter((r) => r.status === "new").length,
        pending: allStored.filter((r) => r.status === "pending").length,
        accepted: allStored.filter((r) => r.status === "accepted").length,
        declined: allStored.filter((r) => r.status === "declined").length,
      },
    };
  }
}

export async function updateRequestStatusAsync(
  requestId: string,
  newStatus: RequestStatus,
  declineReason?: string,
  declineNotes?: string
): Promise<ClientRequest[]> {
  const { updateExpertRequestStatusApi, getExpertRequests } = await import("@/lib/api");

  try {
    await updateExpertRequestStatusApi(requestId, newStatus, declineReason, declineNotes);
    const fresh = await getExpertRequests({ status: "all", page: 1, limit: 20, sort: "newest" });
    if (fresh.requests && fresh.requests.length > 0) {
      saveStoredRequests(fresh.requests);
      return fresh.requests;
    }
  } catch {
    // ignore backend error on offline/standalone mode
  }

  return updateStoredRequestStatus(requestId, newStatus, declineReason, declineNotes);
}

export async function acceptExpertBookingRequest(bookingId: string): Promise<ClientRequest[]> {
  const { submitExpertRequestDecision } = await import("@/lib/api");

  try {
    await submitExpertRequestDecision(bookingId, { decision: "accepted" });
  } catch {
    // ignore backend error on offline/standalone mode
  }

  return updateStoredRequestStatus(bookingId, "accepted");
}


