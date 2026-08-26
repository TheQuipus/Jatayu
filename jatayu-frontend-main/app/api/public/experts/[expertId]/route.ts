import { NextRequest, NextResponse } from "next/server";
import { expertSlug, featuredExperts, getExpertById, normalizeExpert } from "@/lib/experts";
import { publicApiBase } from "@/lib/publicApiBase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ expertId: string }> }
) {
  const { expertId } = await params;
  const decodedId = decodeURIComponent(expertId || "").trim();

  if (!decodedId) {
    return NextResponse.json(
      { success: false, message: "Expert ID is required" },
      { status: 400 }
    );
  }

  // 1. Attempt to fetch live expert data from backend API server
  const backendUrl = publicApiBase();
  try {
    const res = await fetch(`${backendUrl}/api/public/experts/${encodeURIComponent(decodedId)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const rawExpert = (data.expert || data.data || data) as Record<string, unknown>;
      const expert = normalizeExpert(rawExpert);

      const acceptHeader = request.headers.get("accept") || "";
      if (acceptHeader.includes("text/html")) {
        const slug = expertSlug(expert.name);
        return NextResponse.redirect(new URL(`/expert/${slug}`, request.url));
      }

      return NextResponse.json({ success: true, expert });
    }
  } catch {
    // Backend API server unreachable, fallback to local experts store below
  }

  // 2. Fallback lookup in local expert dataset
  const localExpert = getExpertById(decodedId);

  if (!localExpert) {
    return NextResponse.json(
      { success: false, message: "Expert not found" },
      { status: 404 }
    );
  }

  const acceptHeader = request.headers.get("accept") || "";
  if (acceptHeader.includes("text/html")) {
    const slug = expertSlug(localExpert.name);
    return NextResponse.redirect(new URL(`/expert/${slug}`, request.url));
  }

  return NextResponse.json({ success: true, expert: localExpert });
}
