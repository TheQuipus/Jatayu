"use client";

import Link from "next/link";
import { Bookmark, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ExpertCard from "../ui/ExpertCard";
import ExpertFilterSection from "./ExpertFilterSection";
import PriceFilterSection from "./PriceFilterSection";

export type ExpertFilterKey =
  | "topic"
  | "language"
  | "rating"
  | "price"
  | "availability";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getPublicExperts, type PublicExpertsQueryParams } from "@/lib/api";
import {
  availabilityFilters,
  expertiseTags,
  featuredExperts,
  getAvailableLanguages,
  matchesAvailabilityFilter,
  matchesRatingFilter,
  ratingFilters,
  type AvailabilityFilterId,
  type Expert as ExpertType,
  type ExpertiseTag,
  type RatingFilterId,
} from "@/lib/experts";
import { useBookmarks } from "@/lib/useBookmarks";
import styles from "./Expert.module.css";

const ABSOLUTE_MIN_PRICE = 0;
const ABSOLUTE_MAX_PRICE = 300000;

const topicOptions = expertiseTags.map((tag) => ({ value: tag, label: tag }));
const ratingOptions = ratingFilters.map((filter) => ({
  value: filter.id,
  label: filter.label,
}));
const availabilityOptions = availabilityFilters.map((filter) => ({
  value: filter.id,
  label: filter.label,
}));

type AppliedFilter = {
  key: ExpertFilterKey;
  value: string;
  label: string;
};

function toggleSelection<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getOptionLabel(key: ExpertFilterKey, value: string): string {
  switch (key) {
    case "topic":
    case "language":
      return value;
    case "rating":
      return ratingFilters.find((filter) => filter.id === value)?.label ?? value;
    case "availability":
      return availabilityFilters.find((filter) => filter.id === value)?.label ?? value;
    default:
      return value;
  }
}

export type SortOption =
  | "popularity"
  | "price-asc"
  | "price-desc"
  | "alphabetical"
  | "saving-desc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "saving-desc", label: "Saving (High to Low)" },
];

const matchScore = (text: string, query: string): number => {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.startsWith(q)) return 2; // prefix match
  if (t.includes(q)) return 1; // substring match
  return 0; // no match
};

function renderHighlightedText(text: string, highlight: string) {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(
    new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi")
  );
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.trim().toLowerCase() ? (
          <strong key={index} style={{ fontWeight: 700, color: "var(--ink)" }}>
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

export default function Expert({
  seeker = false,
  showBreadcrumb = false,
}: {
  seeker?: boolean;
  showBreadcrumb?: boolean;
}) {
  const [shouldShowBreadcrumb, setShouldShowBreadcrumb] = useState(showBreadcrumb);
  const { bookmarkedExperts, toggleBookmark } = useBookmarks();
  const [selectedTopics, setSelectedTopics] = useState<ExpertiseTag[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<RatingFilterId[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    ABSOLUTE_MIN_PRICE,
    ABSOLUTE_MAX_PRICE,
  ]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<AvailabilityFilterId[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchFieldRef = useRef<HTMLDivElement>(null);

  // Click outside listener for SortSelect dropdown
  useEffect(() => {
    if (!isSortOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isSortOpen]);

  // Click outside listener for Search suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        searchFieldRef.current &&
        !searchFieldRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const availableLanguages = useMemo(
    () => getAvailableLanguages(featuredExperts),
    []
  );

  const languageOptions = useMemo(
    () => availableLanguages.map((language) => ({ value: language, label: language })),
    [availableLanguages]
  );

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const results: { type: "name" | "category" | "language"; text: string; score: number }[] = [];

    // Names
    featuredExperts.forEach((expert) => {
      const score = matchScore(expert.name, query);
      if (score > 0) {
        results.push({ type: "name", text: expert.name, score });
      }
    });

    // Categories
    expertiseTags.forEach((topic) => {
      const score = matchScore(topic, query);
      if (score > 0) {
        results.push({ type: "category", text: topic, score });
      }
    });

    // Languages
    availableLanguages.forEach((lang) => {
      const score = matchScore(lang, query);
      if (score > 0) {
        results.push({ type: "language", text: lang, score });
      }
    });

    // Sort by score desc, then alphabetically by text
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.text.localeCompare(b.text);
    });

    return results.slice(0, 8).map((r) => ({
      ...r,
      key: `${r.type}-${r.text}`,
    }));
  }, [searchQuery, availableLanguages]);

  const selectSuggestion = (suggestion: { text: string }) => {
    setSearchQuery(suggestion.text);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 < 0 ? suggestions.length - 1 : prev - 1));
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          event.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const appliedFilters = useMemo(() => {
    const items: AppliedFilter[] = [];

    selectedTopics.forEach((value) => {
      items.push({ key: "topic", value, label: getOptionLabel("topic", value) });
    });
    selectedLanguages.forEach((value) => {
      items.push({ key: "language", value, label: getOptionLabel("language", value) });
    });
    selectedRatings.forEach((value) => {
      items.push({ key: "rating", value, label: getOptionLabel("rating", value) });
    });
    if (priceRange[0] > ABSOLUTE_MIN_PRICE || priceRange[1] < ABSOLUTE_MAX_PRICE) {
      items.push({
        key: "price",
        value: `${priceRange[0]}-${priceRange[1]}`,
        label: `₹${priceRange[0].toLocaleString("en-IN")} – ₹${priceRange[1].toLocaleString("en-IN")}`,
      });
    }
    selectedAvailabilities.forEach((value) => {
      items.push({ key: "availability", value, label: getOptionLabel("availability", value) });
    });

    return items;
  }, [
    selectedTopics,
    selectedLanguages,
    selectedRatings,
    priceRange,
    selectedAvailabilities,
  ]);

  const filteredExperts = useMemo(() => {
    const matchesFilters = (expert: (typeof featuredExperts)[number]) => {
      if (normalizedSearchQuery) {
        const searchableText = [
          expert.name,
          expert.role,
          expert.desc,
          expert.bio,
          expert.category,
          ...expert.topics,
          ...expert.languages,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(normalizedSearchQuery)) {
          return false;
        }
      }

      if (
        selectedTopics.length > 0 &&
        !selectedTopics.some((topic) => expert.topics.includes(topic))
      ) {
        return false;
      }

      if (
        selectedLanguages.length > 0 &&
        !selectedLanguages.some((language) => expert.languages.includes(language))
      ) {
        return false;
      }

      if (
        selectedRatings.length > 0 &&
        !selectedRatings.some((rating) => matchesRatingFilter(expert, rating))
      ) {
        return false;
      }

      if (expert.price < priceRange[0] || expert.price > priceRange[1]) {
        return false;
      }

      if (
        selectedAvailabilities.length > 0 &&
        !selectedAvailabilities.some((availability) =>
          matchesAvailabilityFilter(expert, availability)
        )
      ) {
        return false;
      }

      return true;
    };

    const results = featuredExperts.filter(
      (expert) => bookmarkedExperts.has(expert.name) || matchesFilters(expert)
    );

    return [...results].sort((a, b) => {
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
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      }
    });
  }, [
    normalizedSearchQuery,
    selectedTopics,
    selectedLanguages,
    selectedRatings,
    priceRange,
    selectedAvailabilities,
    bookmarkedExperts,
    sortBy,
  ]);

  // API & Infinite Scroll state
  const [apiExperts, setApiExperts] = useState<ExpertType[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [usingApi, setUsingApi] = useState(true);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Reset page & list when filters or search change
  useEffect(() => {
    setPage(1);
    setApiExperts([]);
    setHasNextPage(true);
  }, [
    searchQuery,
    selectedTopics,
    selectedLanguages,
    selectedRatings,
    priceRange,
    selectedAvailabilities,
    sortBy,
  ]);

  // Fetch data from API (/api/public/experts)
  useEffect(() => {
    let isCancelled = false;

    async function fetchExpertsData() {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const queryParams: PublicExpertsQueryParams = {
          page,
          limit: 12,
          search: searchQuery.trim() || undefined,
          category: selectedTopics.length > 0 ? selectedTopics.join(",") : undefined,
          topics: selectedTopics.length > 0 ? selectedTopics : undefined,
          languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
          ratings: selectedRatings.length > 0 ? selectedRatings : undefined,
          minPrice: priceRange[0] > ABSOLUTE_MIN_PRICE ? priceRange[0] : undefined,
          maxPrice: priceRange[1] < ABSOLUTE_MAX_PRICE ? priceRange[1] : undefined,
          availability: selectedAvailabilities.length > 0 ? selectedAvailabilities.join(",") : undefined,
          sortBy,
        };

        const res = await getPublicExperts(queryParams);
        if (isCancelled) return;

        setUsingApi(true);
        if (res.experts && res.experts.length > 0) {
          setApiExperts((prev) => {
            if (page === 1) return res.experts;
            const existingIds = new Set(prev.map((item) => item.id || item.name));
            const newItems = res.experts.filter((item) => !existingIds.has(item.id || item.name));
            return [...prev, ...newItems];
          });
          setHasNextPage(res.pagination.hasNextPage);
        } else {
          if (page === 1) setApiExperts([]);
          setHasNextPage(false);
        }
      } catch (err) {
        if (isCancelled) return;
        setUsingApi(false);
        if (page === 1) {
          setApiExperts(filteredExperts);
        }
        setHasNextPage(false);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    fetchExpertsData();

    return () => {
      isCancelled = true;
    };
  }, [
    page,
    searchQuery,
    selectedTopics,
    selectedLanguages,
    selectedRatings,
    priceRange,
    selectedAvailabilities,
    sortBy,
    filteredExperts,
  ]);

  // Infinite Scroll Trigger via IntersectionObserver
  useEffect(() => {
    const sentinel = observerTargetRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading && !isLoadingMore) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, [hasNextPage, isLoading, isLoadingMore]);

  const displayedExpertsList = usingApi ? apiExperts : filteredExperts;

  const removeAppliedFilter = (key: ExpertFilterKey, value: string) => {
    switch (key) {
      case "topic":
        setSelectedTopics((current) => current.filter((item) => item !== value));
        break;
      case "language":
        setSelectedLanguages((current) => current.filter((item) => item !== value));
        break;
      case "rating":
        setSelectedRatings((current) => current.filter((item) => item !== value));
        break;
      case "price":
        setPriceRange([ABSOLUTE_MIN_PRICE, ABSOLUTE_MAX_PRICE]);
        break;
      case "availability":
        setSelectedAvailabilities((current) => current.filter((item) => item !== value));
        break;
    }
  };

  const clearAllFilters = () => {
    setSelectedTopics([]);
    setSelectedLanguages([]);
    setSelectedRatings([]);
    setPriceRange([ABSOLUTE_MIN_PRICE, ABSOLUTE_MAX_PRICE]);
    setSelectedAvailabilities([]);
    setSearchQuery("");
    setSortBy("popularity");
  };

  useEffect(() => {
    const normalizedPath = window.location.pathname.replace(/\/$/, "");
    if (seeker || normalizedPath !== "/expert") return;

    if (window.location.hash === "#from-home") {
      setTimeout(() => {
        setShouldShowBreadcrumb(true);
      }, 0);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [seeker]);


  return (
    <>
      <section className={`${styles.services} ${seeker ? styles.servicesSeeker : ""}`}>
        <div className={`container ${styles.servicesInner}`}>
          {shouldShowBreadcrumb && !seeker ? (
            <div className={styles.breadcrumbWrap}>
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Experts" },
                ]}
              />
            </div>
          ) : null}

          <div className={`${styles.speaks} ${styles.speaksFirst} ${seeker ? styles.speaksSeeker : ""}`}>
            <div className={styles.speaksTop}>
              <h2 className={`display ${styles.speaksTitle}`}>
                <span className={`t-dark ${styles.keepTogether}`}>Find the right expert</span>
                <br />
                <span className={styles.keepTogether}>
                  <span className="t-dark">for </span>
                  <span className="t-muted">your decision</span>
                </span>
              </h2>
              <div className={styles.filterBookmarkRow}>
                <Link
                  href={seeker ? "/seeker/bookmark" : "/bookmark"}
                  className={styles.bookmarkBadge}
                  aria-label={`${bookmarkedExperts.size} bookmarked experts`}
                >
                  <Bookmark className={styles.bookmarkIcon} />
                  <span className={styles.bookmarkCount}>
                    {bookmarkedExperts.size}
                  </span>
                </Link>
              </div>
              <span className={styles.speaksRule} aria-hidden="true"></span>
              <p className={styles.speaksDesc}>
                Guidance that feels human. Have a closer look at expertise before you book.
              </p>
            </div>

            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h3 className={styles.sidebarTitle}>Filters</h3>
                {appliedFilters.length > 0 && (
                  <button
                    type="button"
                    className={styles.clearAllBtn}
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {appliedFilters.length > 0 && (
                <div className={styles.appliedFilterChipsGroup}>
                  {appliedFilters.map((filter) => (
                    <button
                      key={`${filter.key}-${filter.value}`}
                      type="button"
                      className={styles.appliedFilterChip}
                      onClick={() => removeAppliedFilter(filter.key, filter.value)}
                      aria-label={`Remove ${filter.label} filter`}
                    >
                      <span>{filter.label}</span>
                      <X size={12} strokeWidth={2} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.filterSectionsGroup}>
                <ExpertFilterSection
                  filterKey="topic"
                  placeholder="Categories"
                  options={topicOptions}
                  selectedValues={selectedTopics}
                  onToggleValue={(value) =>
                    setSelectedTopics((current) =>
                      toggleSelection(current, value as ExpertiseTag)
                    )
                  }
                  onClear={() => setSelectedTopics([])}
                  defaultOpen={true}
                />
                <ExpertFilterSection
                  filterKey="language"
                  placeholder="Languages"
                  options={languageOptions}
                  selectedValues={selectedLanguages}
                  onToggleValue={(value) =>
                    setSelectedLanguages((current) => toggleSelection(current, value))
                  }
                  onClear={() => setSelectedLanguages([])}
                />
                <ExpertFilterSection
                  filterKey="rating"
                  placeholder="Ratings"
                  options={ratingOptions}
                  selectedValues={selectedRatings}
                  onToggleValue={(value) =>
                    setSelectedRatings((current) =>
                      toggleSelection(current, value as RatingFilterId)
                    )
                  }
                  onClear={() => setSelectedRatings([])}
                />
                <PriceFilterSection
                  minPrice={priceRange[0]}
                  maxPrice={priceRange[1]}
                  absoluteMin={ABSOLUTE_MIN_PRICE}
                  absoluteMax={ABSOLUTE_MAX_PRICE}
                  onChange={(min, max) => setPriceRange([min, max])}
                  defaultOpen={true}
                />
                <ExpertFilterSection
                  filterKey="availability"
                  placeholder="Availability"
                  options={availabilityOptions}
                  selectedValues={selectedAvailabilities}
                  onToggleValue={(value) =>
                    setSelectedAvailabilities((current) =>
                      toggleSelection(current, value as AvailabilityFilterId)
                    )
                  }
                  onClear={() => setSelectedAvailabilities([])}
                />
              </div>
            </aside>

            <div className={styles.contentArea}>
              <div className={styles.topBar}>
                <span className={styles.topBarLine1} aria-hidden="true" />
                <span className={styles.topBarLine2} aria-hidden="true" />
                <div className={styles.searchFieldContainer} ref={searchFieldRef}>
                  <label className={styles.searchField}>
                    <Search
                      size={16}
                      strokeWidth={2}
                      className={styles.searchIcon}
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      className={styles.searchInput}
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setIsOpen(true);
                        setActiveIndex(-1);
                      }}
                      onFocus={() => {
                        setIsOpen(true);
                        setActiveIndex(-1);
                      }}
                      onKeyDown={handleKeyDown}
                      aria-label="Search experts"
                      role="combobox"
                      aria-expanded={isOpen && suggestions.length > 0}
                      aria-autocomplete="list"
                      aria-controls="search-suggestions"
                    />
                  </label>
                  {isOpen && suggestions.length > 0 && (
                    <ul
                      id="search-suggestions"
                      className={styles.suggestionsList}
                      role="listbox"
                    >
                      {suggestions.map((suggestion, index) => {
                        const isSelected = index === activeIndex;
                        return (
                          <li key={suggestion.key} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`${styles.suggestionItem} ${
                                isSelected ? styles.suggestionItemActive : ""
                              }`}
                              onClick={() => selectSuggestion(suggestion)}
                            >
                              <div className={styles.suggestionLeft}>
                                <span className={styles.suggestionText}>
                                  {renderHighlightedText(suggestion.text, searchQuery)}
                                </span>
                              </div>
                              <span className={styles.suggestionType}>
                                {suggestion.type === "name" && "Expert"}
                                {suggestion.type === "category" && "Category"}
                                {suggestion.type === "language" && "Language"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className={styles.sortWrapper} ref={sortRef}>
                  <span className={styles.sortLabel}>
                    Sort by:
                  </span>
                  <div className={styles.customSelectContainer}>
                    <button
                      type="button"
                      className={styles.customSelectTrigger}
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      aria-haspopup="listbox"
                      aria-expanded={isSortOpen}
                    >
                      <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                      <ChevronDown
                        size={14}
                        strokeWidth={2}
                        className={styles.customSelectChevron}
                        aria-hidden="true"
                      />
                    </button>
                    {isSortOpen && (
                      <ul className={styles.customSelectList} role="listbox">
                        {sortOptions.map((option) => {
                          const isSelected = option.value === sortBy;
                          return (
                            <li key={option.value} role="presentation">
                              <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.customSelectItem} ${
                                  isSelected ? styles.customSelectItemActive : ""
                                }`}
                                onClick={() => {
                                  setSortBy(option.value);
                                  setIsSortOpen(false);
                                }}
                              >
                                {option.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.speaksCards}>
                {isLoading && page === 1 ? (
                  <div className={styles.infiniteScrollContainer}>
                    <div className={styles.spinner} role="status" aria-label="Loading experts..." />
                  </div>
                ) : displayedExpertsList.length === 0 ? (
                  <p className={styles.noResults}>No experts match your filters yet.</p>
                ) : (
                  displayedExpertsList.map((expert, index) => {
                    const isBookmarked = bookmarkedExperts.has(expert.name);

                    return (
                      <ExpertCard
                        key={`${expert.id || expert.name}-${index}`}
                        expert={expert}
                        isBookmarked={isBookmarked}
                        onBookmarkToggle={() => toggleBookmark(expert.name)}
                        priority={index < 2}
                        seeker={seeker}
                      />
                    );
                  })
                )}
              </div>

              <div ref={observerTargetRef} className={styles.infiniteScrollContainer}>
                {isLoadingMore && (
                  <div className={styles.spinner} role="status" aria-label="Loading more experts..." />
                )}
                {!hasNextPage && displayedExpertsList.length > 0 && !isLoading && (
                  <p className={styles.endOfListText}>You&apos;ve reached the end of the experts list.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
