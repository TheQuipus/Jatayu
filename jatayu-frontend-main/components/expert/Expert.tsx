"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
  availabilityFilters,
  expertiseTags,
  featuredExperts,
  getAvailableLanguages,
  matchesAvailabilityFilter,
  matchesRatingFilter,
  ratingFilters,
  type AvailabilityFilterId,
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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const availableLanguages = useMemo(
    () => getAvailableLanguages(featuredExperts),
    []
  );

  const languageOptions = useMemo(
    () => availableLanguages.map((language) => ({ value: language, label: language })),
    [availableLanguages]
  );

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
                  className="eyebrow eyebrow--dark"
                >
                  <i className="dot"></i>
                  {String(bookmarkedExperts.size).padStart(2, "0")}&nbsp;&nbsp;BOOKMARKED
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
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search experts"
                  />
                </label>

                <div className={styles.sortWrapper}>
                  <label htmlFor="sort-by" className={styles.sortLabel}>
                    Sort by:
                  </label>
                  <select
                    id="sort-by"
                    className={styles.sortSelect}
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    aria-label="Sort experts by"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="saving-desc">Saving (High to Low)</option>
                  </select>
                </div>
              </div>

              <div className={styles.speaksCards}>
                {filteredExperts.length === 0 ? (
                  <p className={styles.noResults}>No experts match your filters yet.</p>
                ) : (
                  filteredExperts.map((expert, index) => {
                    const isBookmarked = bookmarkedExperts.has(expert.name);

                    return (
                      <ExpertCard
                        key={expert.name}
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
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
