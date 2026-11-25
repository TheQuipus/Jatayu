"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import {
  MENU_CATEGORIES,
  MENU_CATEGORIES_WITH_ALL,
  MenuCategoryItem,
  MenuExpertProfile,
} from "@/data/menuCategories";
import { getExpertDetailHref } from "@/lib/experts";
import styles from "./MenuCategoryPanel.module.css";

interface MenuCategoryPanelProps {
  onCloseMenu?: () => void;
}

export default function MenuCategoryPanel({ onCloseMenu }: MenuCategoryPanelProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MenuCategoryItem>(MENU_CATEGORIES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  const handleSelectCategory = (cat: MenuCategoryItem) => {
    setActiveCategory(cat);
    setHoveredItemKey(null);
    setIsDropdownOpen(false);
  };

  const handleNavigate = (expert: MenuExpertProfile) => {
    const href = getExpertDetailHref(expert.slug || expert.name);
    if (onCloseMenu) {
      onCloseMenu();
    }
    router.push(href);
  };

  // Distribute experts across rows without repetition (no redundant/repeated capsules)
  const experts = activeCategory.experts;
  // If 6 or more experts, use 3 rows. If 2-5 experts, use 2 rows. If 1 expert, use 1 row.
  const numRows = experts.length > 6 ? 3 : experts.length > 3 ? 2 : 1;

  const rows: MenuExpertProfile[][] = Array.from({ length: numRows }, () => []);
  experts.forEach((expert, i) => {
    rows[i % numRows].push(expert);
  });

  // Dynamic animation duration - brisk and responsive speed
  const marqueeDuration = `${Math.min(Math.max(experts.length * 2.8, 14), 28)}s`;

  const renderCapsuleSlot = (
    expert: MenuExpertProfile,
    itemKey: string,
    isHovered: boolean,
    isFirstRow: boolean
  ) => {
    return (
      <div
        key={itemKey}
        className={`${styles.capsuleSlot} ${isHovered ? styles.capsuleSlotActive : ""}`}
        onMouseEnter={() => setHoveredItemKey(itemKey)}
        onMouseLeave={() => setHoveredItemKey(null)}
      >
        {/* Floating Hover Preview Card (Image 2) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: isFirstRow ? 8 : -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isFirstRow ? 6 : -6, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`${styles.hoverCard} ${
                isFirstRow ? styles.hoverCardBelow : styles.hoverCardAbove
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate(expert);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigate(expert);
                }
              }}
              aria-label={`View profile for ${expert.name}`}
            >
              <div className={styles.cardImageWrap}>
                <Image
                  src={expert.image}
                  alt={expert.name}
                  fill
                  className={styles.cardImage}
                  sizes="236px"
                />
                <div className={styles.cardGradientOverlay} />
              </div>
              <div className={styles.cardMeta}>
                <div className={styles.cardNameRow}>
                  <span className={styles.cardStatusDot} />
                  <span className={styles.cardName}>{expert.name}</span>
                </div>
                <div className={styles.cardPriceRow}>
                  From ₹{expert.price || 499}
                </div>
                <div className={styles.cardDivider} />
                <p className={styles.cardDesc}>{expert.quote}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hovered State -> "LET'S TALK" Pill Button vs Normal Capsule */}
        {isHovered ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(expert);
            }}
            className={styles.letsTalkPill}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleNavigate(expert);
              }
            }}
            aria-label={`Let's talk with ${expert.name}`}
          >
            <span className={styles.letsTalkText}>
              <span className={styles.labelTrack}>
                <span className={styles.labelUp}>LET&apos;S TALK</span>
                <span className={styles.labelUp} aria-hidden="true">
                  LET&apos;S TALK
                </span>
              </span>
            </span>
            <span className={styles.letsTalkIcon} aria-hidden="true">
              <img
                src="/assets/buttonsvg.svg"
                alt=""
                width={26}
                height={26}
              />
            </span>
          </div>
        ) : (
          <div
            onClick={() => handleNavigate(expert)}
            className={styles.capsulePill}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleNavigate(expert);
              }
            }}
            aria-label={`View profile for ${expert.name}, ${expert.role}`}
          >
            <div className={styles.capsuleAvatarWrapper}>
              <Image
                src={expert.image}
                alt={expert.name}
                fill
                sizes="38px"
                className="object-cover object-top"
              />
            </div>
            <div className={styles.capsuleTextWrapper}>
              <div className={styles.capsuleName}>{expert.name}</div>
              <div className={styles.capsuleRole}>{expert.role}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.panelContainer}>

      {/* Main Content Layout */}
      <div className={styles.contentWrapper}>
        {/* Header Section with Dropdown - Figma Image 4a */}
        <div className={styles.headerSection} ref={dropdownRef}>
          <div className={styles.categoryEyebrow}>Category</div>

          <button
            type="button"
            className={styles.categoryDropdownTrigger}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            aria-label={`Current category: ${activeCategory.fullName}. Click to select another category`}
          >
            <h2 className={styles.categoryTitle}>{activeCategory.displayName}</h2>
            <span
              className={`${styles.dropdownArrow} ${
                isDropdownOpen ? styles.dropdownArrowOpen : ""
              }`}
            >
              <ChevronDown size={22} strokeWidth={2.5} />
            </span>
          </button>

          {/* Dropdown Menu List - Categories with ALL Option */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={styles.dropdownMenu}
                role="listbox"
              >
                {MENU_CATEGORIES_WITH_ALL.map((cat) => {
                  const isSelected = cat.id === activeCategory.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCategory(cat)}
                      className={`${styles.dropdownItem} ${
                        isSelected ? styles.dropdownItemActive : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected && <Check size={14} className="text-[#FF5C01]" />}
                        {cat.fullName}
                      </span>
                      <span className={styles.dropdownItemCount}>
                        {cat.experts.length}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Star Divider Line */}
          <div className={styles.starDivider} aria-hidden="true">
            <span className={styles.starIcon}>✦</span>
            <div className={styles.dividerLine} />
          </div>
        </div>

        {/* Continuous Testimonial Marquee Viewport */}
        <motion.div
          key={activeCategory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={`${styles.marqueeViewport} ${
            hoveredItemKey ? styles.marqueePaused : ""
          }`}
        >
          {rows.map((rowExperts, rowIdx) => {
            const isFirstRow = rowIdx === 0;
            const isRowActive = hoveredItemKey?.startsWith(`r${rowIdx}-`);
            const rowClass =
              rowIdx % 2 === 0
                ? styles.marqueeRowLeft
                : styles.marqueeRowRight;

            return (
              <div
                key={`row-${rowIdx}`}
                className={`${rowClass} ${isRowActive ? styles.marqueeRowActive : ""}`}
                style={{ "--marquee-duration": marqueeDuration } as React.CSSProperties}
              >
                {rowExperts.map((expert, idx) => {
                  const itemKey = `r${rowIdx}-${expert.id}-${idx}`;
                  return renderCapsuleSlot(
                    expert,
                    itemKey,
                    hoveredItemKey === itemKey,
                    isFirstRow
                  );
                })}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

