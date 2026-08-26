import { NextRequest, NextResponse } from "next/server";
import { featuredExperts, matchesAvailabilityFilter, getAvailableLanguages, parseReplyTimeMinutes } from "@/lib/experts";
import { publicApiBase } from "@/lib/publicApiBase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const category = searchParams.get("category") || "";
  const search = (searchParams.get("search") || searchParams.get("query") || "").toLowerCase().trim();
  const topicsStr = searchParams.get("topics") || searchParams.get("topic") || "";
  const topics = topicsStr ? topicsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const languagesStr = searchParams.get("languages") || searchParams.get("language") || "";
  const languages = languagesStr ? languagesStr.split(",").map((l) => l.trim()).filter(Boolean) : [];
  const ratingsStr = searchParams.get("ratings") || searchParams.get("rating") || "";
  const ratings = ratingsStr ? ratingsStr.split(",").map((r) => r.trim()).filter(Boolean) : [];
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const availability = searchParams.get("availability") || "";
  const sortBy = searchParams.get("sort") || searchParams.get("sortBy") || "popularity";

  // 1. Attempt to fetch live experts from backend API server
  const backendUrl = publicApiBase();
  try {
    const queryString = searchParams.toString();
    const res = await fetch(`${backendUrl}/api/public/experts?${queryString}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend API server unreachable; fallback to local experts data store below
  }

  // 2. Fallback filtering over featuredExperts
  let filtered = featuredExperts.filter((expert) => {
    if (search) {
      const searchable = [
        expert.name,
        expert.role,
        expert.desc,
        expert.bio,
        expert.category,
        ...(expert.topics || []),
        ...(expert.languages && expert.languages.length > 0 ? expert.languages : ["English"]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(search)) return false;
    }

    if (category) {
      const catTargets = category.toLowerCase().split(",").map((c) => c.trim()).filter(Boolean);
      const expCategory = (expert.category || "").toLowerCase();
      const expTopics = (expert.topics || []).map((t) => t.toLowerCase());
      const matchesCat = catTargets.some((ct) => expCategory.includes(ct) || expTopics.some((t) => t.includes(ct)));
      if (!matchesCat) return false;
    }

    if (topics.length > 0) {
      const expCategory = (expert.category || "").toLowerCase();
      const expTopics = (expert.topics || []).map((t) => t.toLowerCase());
      const matchesTopic = topics.some((tp) => {
        const tpLower = tp.toLowerCase();
        return expCategory.includes(tpLower) || expTopics.some((t) => t.includes(tpLower));
      });
      if (!matchesTopic) return false;
    }

    if (languages.length > 0) {
      const expLangs = (expert.languages && expert.languages.length > 0 ? expert.languages : ["English"]).map((l) => l.toLowerCase());
      const matchesLang = languages.some((l) => expLangs.some((el) => el.includes(l.toLowerCase())));
      if (!matchesLang) return false;
    }

    if (ratings.length > 0) {
      const matchesRating = ratings.some((r) => {
        const numRating = parseFloat(r);
        return !isNaN(numRating) ? expert.rating >= numRating : true;
      });
      if (!matchesRating) return false;
    }

    if (minPrice !== undefined && expert.price < minPrice) return false;
    if (maxPrice !== undefined && expert.price > maxPrice) return false;

    if (availability) {
      const availMaxMinutes = parseInt(availability, 10);
      if (!isNaN(availMaxMinutes)) {
        const replyMins = expert.replyTime ? parseReplyTimeMinutes(expert.replyTime) : 15;
        if (replyMins > availMaxMinutes) return false;
      } else {
        if (!matchesAvailabilityFilter(expert, availability as any)) return false;
      }
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "alphabetical":
        return a.name.localeCompare(b.name);
      case "saving-desc":
        return a.price - b.price;
      case "popularity":
      default:
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    }
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * limit;
  const paginatedExperts = filtered.slice(startIndex, startIndex + limit);

  // Map to backend public API expert model format
  const mappedExperts = paginatedExperts.map((exp) => ({
    id: exp.id,
    fullName: exp.name,
    professionalTitle: exp.role,
    tagLine: exp.desc,
    bio: exp.bio,
    profilePhotoSrc: exp.image,
    category: exp.category,
    skills: exp.topics,
    focusAreas: [],
    topics: exp.topics,
    languages: exp.languages,
    experienceLevel: "emerging",
    targetAudience: [],
    timezone: "Asia/Calcutta",
    selectedFormats: ["video"],
    selectedLengths: ["15"],
    formatPrices: { video: String(exp.price) },
    price: exp.price,
    replyTime: exp.replyTime || null,
    replyTimeMinutes: null,
    availabilities: exp.availabilities || [],
  }));

  const allCategories = Array.from(
    new Set(featuredExperts.map((e) => e.category).filter((c): c is string => Boolean(c)))
  );
  const allLanguages = getAvailableLanguages(featuredExperts);
  const prices = featuredExperts.map((e) => e.price);

  return NextResponse.json({
    experts: mappedExperts,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
    filters: {
      categories: allCategories,
      languages: allLanguages,
      price: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 300000,
      },
      availability: [
        { value: 15, label: "Under 15 min" },
        { value: 30, label: "Under 30 min" },
        { value: 120, label: "Under 2 hours" },
      ],
    },
  });
}
