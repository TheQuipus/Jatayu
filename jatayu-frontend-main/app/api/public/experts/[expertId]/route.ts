import { NextRequest, NextResponse } from "next/server";
import { expertSlug, featuredExperts, getExpertById, normalizeExpert } from "@/lib/experts";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return featuredExperts.map((expert) => ({
    expertId: expertSlug(expert.name),
  }));
}

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

  const targetId =
    expertSlug(decodedId) === "aditya-kane"
      ? "6ca14cb0-b79c-4628-9fe2-ec8a9bce67e4"
      : decodedId;

  // 1. Attempt to fetch live expert data from backend API server
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${backendUrl}/api/public/experts/${encodeURIComponent(targetId)}`, {
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
