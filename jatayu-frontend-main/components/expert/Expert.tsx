"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ExpertCard from "../ui/ExpertCard";
import ExpertFilterDropdown, { type ExpertFilterKey } from "./ExpertFilterDropdown";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import {
  availabilityFilters,
  expertiseTags,
  featuredExperts,
  getAvailableLanguages,
  matchesAvailabilityFilter,
  matchesPriceRangeFilter,
  matchesRatingFilter,
  priceRangeFilters,
  ratingFilters,
  type AvailabilityFilterId,
  type ExpertiseTag,
  type PriceRangeFilterId,
  type RatingFilterId,
} from "@/lib/experts";
import { useBookmarks } from "@/lib/useBookmarks";
import styles from "./Expert.module.css";

const topicOptions = expertiseTags.map((tag) => ({ value: tag, label: tag }));
const ratingOptions = ratingFilters.map((filter) => ({
  value: filter.id,
  label: filter.label,
}));
const priceOptions = priceRangeFilters.map((filter) => ({
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
    case "price":
      return priceRangeFilters.find((filter) => filter.id === value)?.label ?? value;
    case "availability":
      return availabilityFilters.find((filter) => filter.id === value)?.label ?? value;
  }
}

export default function Expert({
  seeker = false,
  showBreadcrumb = false,
}: {
  seeker?: boolean;
  showBreadcrumb?: boolean;
}) {
  const topicRowShellRef = useRef<HTMLDivElement>(null);
  const filterRowRef = useRef<HTMLDivElement>(null);
  const [isTopicRowStuck, setIsTopicRowStuck] = useState(false);
  const [shouldShowBreadcrumb, setShouldShowBreadcrumb] = useState(showBreadcrumb);
  const [openDropdown, setOpenDropdown] = useState<ExpertFilterKey | null>(null);
  const { bookmarkedExperts, toggleBookmark } = useBookmarks();
  const [selectedTopics, setSelectedTopics] = useState<ExpertiseTag[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<RatingFilterId[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<PriceRangeFilterId[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<AvailabilityFilterId[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");

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
    selectedPriceRanges.forEach((value) => {
      items.push({ key: "price", value, label: getOptionLabel("price", value) });
    });
    selectedAvailabilities.forEach((value) => {
      items.push({ key: "availability", value, label: getOptionLabel("availability", value) });
    });

    return items;
  }, [
    selectedTopics,
    selectedLanguages,
    selectedRatings,
    selectedPriceRanges,
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

      if (
        selectedPriceRanges.length > 0 &&
        !selectedPriceRanges.some((priceRange) => matchesPriceRangeFilter(expert, priceRange))
      ) {
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

    return featuredExperts.filter(
      (expert) => bookmarkedExperts.has(expert.name) || matchesFilters(expert)
    );
  }, [
    normalizedSearchQuery,
    selectedTopics,
    selectedLanguages,
    selectedRatings,
    selectedPriceRanges,
    selectedAvailabilities,
    bookmarkedExperts,
  ]);

  const toggleDropdown = (key: ExpertFilterKey) => {
    setOpenDropdown((current) => (current === key ? null : key));
  };

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
        setSelectedPriceRanges((current) => current.filter((item) => item !== value));
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
    setSelectedPriceRanges([]);
    setSelectedAvailabilities([]);
    setSearchQuery("");
    setOpenDropdown(null);
  };

  useEffect(() => {
    if (!openDropdown) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        filterRowRef.current &&
        !filterRowRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  useEffect(() => {
    const shell = topicRowShellRef.current;
    if (!shell) return;

    const updateStuckState = () => {
      if (getComputedStyle(shell).position !== "sticky") {
        setIsTopicRowStuck(false);
        return;
      }

      const stickyTopPx = parseFloat(getComputedStyle(shell).top) || 82;
      setIsTopicRowStuck(shell.getBoundingClientRect().top <= stickyTopPx + 0.5);
    };

    updateStuckState();
    window.addEventListener("scroll", updateStuckState, { passive: true });
    window.addEventListener("resize", updateStuckState);

    return () => {
      window.removeEventListener("scroll", updateStuckState);
      window.removeEventListener("resize", updateStuckState);
    };
  }, []);

  useEffect(() => {
    const normalizedPath = window.location.pathname.replace(/\/$/, "");
    if (seeker || normalizedPath !== "/expert") return;

    if (window.location.hash === "#from-home") {
      setShouldShowBreadcrumb(true);
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
            <h2 className={`display ${styles.speaksTitle}`}>
              <span className={`t-dark ${styles.keepTogether}`}>Find the right expert</span>
              <br />
              <span className={styles.keepTogether}>
                <span className="t-dark">for </span>
                <span className="t-muted">your decision</span>
              </span>
            </h2>
            <span className={styles.speaksRule} aria-hidden="true"></span>
            <p className={styles.speaksDesc}>
              Guidance that feels human. Have a closer look at expertise before you book.
            </p>

            <div
              ref={topicRowShellRef}
              className={`${styles.topicRowShell} ${isTopicRowStuck ? styles.topicRowShellStuck : ""}`}
            >
              <div className={styles.topicRowBackdrop} aria-hidden="true" />
              <div className={styles.filterBookmarkRow}>
                <Link
                  href={seeker ? "/seeker/bookmark" : "/bookmark"}
                  className="eyebrow eyebrow--dark"
                >
                  <i className="dot"></i>
                  {String(bookmarkedExperts.size).padStart(2, "0")}&nbsp;&nbsp;BOOKMARKED
                </Link>
              </div>
              <div className={styles.filterPanel} ref={filterRowRef}>
                <div className={styles.topicRow}>
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

                  <ExpertFilterDropdown
                    filterKey="topic"
                    triggerId="expert-topic-filter"
                    placeholder="Categories"
                    clearLabel="All Topics"
                    options={topicOptions}
                    selectedValues={selectedTopics}
                    openDropdown={openDropdown}
                    onToggle={toggleDropdown}
                    onToggleValue={(value) =>
                      setSelectedTopics((current) =>
                        toggleSelection(current, value as ExpertiseTag)
                      )
                    }
                    onClear={() => setSelectedTopics([])}
                  />
                  <ExpertFilterDropdown
                    filterKey="language"
                    triggerId="expert-language-filter"
                    placeholder="Languages"
                    clearLabel="All Languages"
                    options={languageOptions}
                    selectedValues={selectedLanguages}
                    openDropdown={openDropdown}
                    onToggle={toggleDropdown}
                    onToggleValue={(value) =>
                      setSelectedLanguages((current) => toggleSelection(current, value))
                    }
                    onClear={() => setSelectedLanguages([])}
                  />
                  <ExpertFilterDropdown
                    filterKey="rating"
                    triggerId="expert-rating-filter"
                    placeholder="Ratings"
                    clearLabel="All Ratings"
                    options={ratingOptions}
                    selectedValues={selectedRatings}
                    openDropdown={openDropdown}
                    onToggle={toggleDropdown}
                    onToggleValue={(value) =>
                      setSelectedRatings((current) =>
                        toggleSelection(current, value as RatingFilterId)
                      )
                    }
                    onClear={() => setSelectedRatings([])}
                  />
                  <ExpertFilterDropdown
                    filterKey="price"
                    triggerId="expert-price-filter"
                    placeholder="Price Range"
                    clearLabel="All Prices"
                    options={priceOptions}
                    selectedValues={selectedPriceRanges}
                    openDropdown={openDropdown}
                    onToggle={toggleDropdown}
                    onToggleValue={(value) =>
                      setSelectedPriceRanges((current) =>
                        toggleSelection(current, value as PriceRangeFilterId)
                      )
                    }
                    onClear={() => setSelectedPriceRanges([])}
                  />
                  <ExpertFilterDropdown
                    filterKey="availability"
                    triggerId="expert-availability-filter"
                    placeholder="Availability"
                    clearLabel="Any Availability"
                    options={availabilityOptions}
                    selectedValues={selectedAvailabilities}
                    openDropdown={openDropdown}
                    onToggle={toggleDropdown}
                    onToggleValue={(value) =>
                      setSelectedAvailabilities((current) =>
                        toggleSelection(current, value as AvailabilityFilterId)
                      )
                    }
                    onClear={() => setSelectedAvailabilities([])}
                  />
                </div>

                <div className={styles.appliedFiltersRow}>
                  {appliedFilters.length > 0 && (
                    <>
                      <div className={styles.appliedFiltersList}>
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
                      <button
                        type="button"
                        className={styles.clearAllBtn}
                        onClick={clearAllFilters}
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
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
      </section>
    </>
  );
}
