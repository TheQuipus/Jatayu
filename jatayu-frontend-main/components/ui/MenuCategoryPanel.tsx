"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { MENU_CATEGORIES, MenuCategoryItem, MenuExpertProfile } from "@/data/menuCategories";
import { getExpertDetailHref } from "@/lib/experts";
import styles from "./MenuCategoryPanel.module.css";

interface MenuCategoryPanelProps {
  onCloseMenu?: () => void;
}

export default function MenuCategoryPanel({ onCloseMenu }: MenuCategoryPanelProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MenuCategoryItem>(MENU_CATEGORIES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredExpertId, setHoveredExpertId] = useState<string | null>(null);

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
    setIsDropdownOpen(false);
    setHoveredExpertId(null);
  };

  const handleNavigate = (expert: MenuExpertProfile) => {
    const href = getExpertDetailHref(expert.slug || expert.name);
    if (onCloseMenu) {
      onCloseMenu();
    }
    router.push(href);
  };

  return (
    <div className={styles.panelContainer}>
      {/* Dramatic Background Stage Imagery */}
      {/* <div className={styles.bgLayer} aria-hidden="true" />
      <div className={styles.bgOverlay} aria-hidden="true" /> */}

      {/* Ghost Typography Watermarks */}
      {/* <div className={styles.ghostSubtitle} aria-hidden="true">
        YOU ARE INVITED TO OUR ANNUAL
      </div>
      <div className={styles.ghostWatermark} aria-hidden="true">
        EXPERT CONFERENCE
      </div> */}

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

          {/* Dropdown Menu List - 8 Categories from Image 2 */}
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
                {MENU_CATEGORIES.map((cat) => {
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

        {/* 3-Column Capsule Grid - Figma Image 4b */}
        <motion.div
          key={activeCategory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={styles.capsuleGrid}
        >
          {activeCategory.experts.map((expert, idx) => {
            const isHovered = hoveredExpertId === expert.id;
            const isRow1 = idx < 3;

            return (
              <div
                key={expert.id}
                className={styles.capsuleSlot}
                onMouseEnter={() => setHoveredExpertId(expert.id)}
                onMouseLeave={() => setHoveredExpertId(null)}
              >
                {/* Floating Hover Preview Card (Image 3 & 4) */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: isRow1 ? -6 : 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={`${styles.hoverCard} ${
                        isRow1 ? styles.hoverCardBelow : styles.hoverCardAbove
                      }`}
                      onClick={() => handleNavigate(expert)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNavigate(expert);
                        }
                      }}
                      aria-label={`View profile for ${expert.name}`}
                    >
                      {/* Top Category Badge */}
                      <div className={styles.cardBadgeWrap}>
                        <span className={styles.cardBadge}>
                          <span className={styles.cardBadgeDot} />
                          {expert.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Expert Portrait Image */}
                      <div className={styles.cardImageWrap}>
                        <Image
                          src={expert.image}
                          alt={expert.name}
                          fill
                          sizes="236px"
                          className={styles.cardImage}
                        />
                      </div>

                      {/* Gradient Overlay for Legibility */}
                      <div className={styles.cardGradientOverlay} />

                      {/* Bottom Meta Information */}
                      <div className={styles.cardMeta}>
                        <div className={styles.cardNameRow}>
                          <span className={styles.cardStatusDot} />
                          <span className={styles.cardName}>{expert.name}</span>
                        </div>
                        <div className={styles.cardPriceRow}>
                          From ₹{expert.price || 499} / Rating {expert.rating || 4.9} / Reply {expert.replyTime || "15 min"}
                        </div>
                        <div className={styles.cardDivider} />
                        <p className={styles.cardDesc}>{expert.quote}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Capsule / LET'S TALK Button State */}
                {isHovered ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleNavigate(expert)}
                    className={styles.letsTalkPill}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNavigate(expert);
                      }
                    }}
                    aria-label={`Let's Talk with ${expert.name}`}
                  >
                    <span className={styles.letsTalkText}>LET&apos;S TALK</span>
                    <span className={styles.letsTalkIcon}>
                      <img src="/assets/buttonsvg.svg" alt="" width={26} height={26} />
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
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
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

