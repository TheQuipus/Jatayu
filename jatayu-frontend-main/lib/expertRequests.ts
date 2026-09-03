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

export const INITIAL_CLIENT_REQUESTS: ClientRequest[] = [];

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


