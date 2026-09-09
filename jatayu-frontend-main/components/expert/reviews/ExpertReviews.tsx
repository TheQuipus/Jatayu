"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Filter,
  Lock,
  Medal,
  MessageSquare,
  Send,
  Shield,
  Star,
  Zap,
  TrendingUp,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import {
  REVIEWS_SUMMARY,
  NET_PROMOTER_SCORE,
  CATEGORY_SCORES,
  DAILY_RATING_TREND,
  WEEKLY_RATING_TREND,
  MONTHLY_RATING_TREND,
  ACHIEVEMENT_BADGES,
  INITIAL_REVIEWS,
  type ReviewItem,
} from "@/lib/expertReviewsStore";
import styles from "./ExpertReviews.module.css";

export default function ExpertReviews() {
  const [trendView, setTrendView] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [activeTab, setActiveTab] = useState<"all" | "needsReply" | "fiveStar" | "recent">("all");
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState<string>("");

  const trendPoints =
    trendView === "daily"
      ? DAILY_RATING_TREND
      : trendView === "weekly"
      ? WEEKLY_RATING_TREND
      : MONTHLY_RATING_TREND;

  // Calculate SVG Rating Trend chart path with Star Y-Axis
  const minVal = 4.4;
  const maxVal = 5.05;
  const range = maxVal - minVal;

  const svgWidth = 520;
  const svgHeight = 160;
  const padLeft = 48;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 16;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const yTicks = [
    { value: 5.0, label: "5.0 ★" },
    { value: 4.8, label: "4.8 ★" },
    { value: 4.6, label: "4.6 ★" },
    { value: 4.4, label: "4.4 ★" },
  ];

  const pts = trendPoints.map((pt, i) => {
    const x = padLeft + (i / (trendPoints.length - 1)) * chartW;
    const y = padTop + chartH - ((pt.rating - minVal) / range) * chartH;
    return { x, y, label: pt.label, rating: pt.rating };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${svgHeight - padBottom} L ${pts[0].x} ${svgHeight - padBottom} Z`;

  // Filter reviews
  const filteredReviews = reviews.filter((rev) => {
    if (activeTab === "needsReply") return rev.status === "Needs Reply";
    if (activeTab === "fiveStar") return rev.rating === 5.0;
    return true;
  });

  // Handle submit reply
  const handleSubmitReply = (reviewId: string) => {
    if (!replyInput.trim()) return;

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            status: "Replied",
            reply: {
              date: "Just now",
              text: replyInput.trim(),
            },
          };
        }
        return r;
      })
    );

    setActiveReplyId(null);
    setReplyInput("");
  };

  const renderBadgeIcon = (iconType: string) => {
    if (iconType === "star") return <Star size={16} fill="#FFB800" color="#FFB800" />;
    if (iconType === "shield") return <Shield size={16} />;
    if (iconType === "zap") return <Zap size={16} />;
    if (iconType === "medal") return <Medal size={16} />;
    if (iconType === "crown") return <Crown size={16} />;
    return <Lock size={16} />;
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        {/* --------------------------------------------------
            1. HEADER AREA
        -------------------------------------------------- */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <p className={styles.pageSubtitle}>Client feedback, ratings & performance insights</p>
            <h1 className={styles.pageTitle}>
              Reviews & <span className={styles.accentWord}>REPUTATION</span>
            </h1>
          </div>
        </div>

        {/* --------------------------------------------------
            2. KPI OVERVIEW METRICS ROW
        -------------------------------------------------- */}
        <div className={styles.summaryGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Overall Rating</span>
              <span className={styles.kpiIconBox}>
                <Star size={18} fill="currentColor" />
              </span>
            </div>
            <div className={styles.kpiValue}>{REVIEWS_SUMMARY.overallRating}</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Total Reviews</span>
              <span className={styles.kpiIconBox}>
                <MessageCircle size={18} />
              </span>
            </div>
            <div className={styles.kpiValue}>{REVIEWS_SUMMARY.totalReviews}</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Recommendation</span>
              <span className={styles.kpiIconBox}>
                <ThumbsUp size={18} />
              </span>
            </div>
            <div className={styles.kpiValue}>{REVIEWS_SUMMARY.recommendationPercent}%</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Response Rate</span>
              <span className={styles.kpiIconBox}>
                <TrendingUp size={18} />
              </span>
            </div>
            <div className={styles.kpiValue}>{REVIEWS_SUMMARY.responseRatePercent}%</div>
          </div>
        </div>

        {/* --------------------------------------------------
            3. TOP ROW: RATING OVERVIEW & PERFORMANCE INSIGHTS
        -------------------------------------------------- */}
        <div className={styles.topRowGrid}>
          {/* Rating Summary Card */}
          <div className={`${styles.card} ${styles.ratingSummaryCard}`}>
            <div>
              <div className={styles.sectionHeader} style={{ marginBottom: 12 }}>
                <span className={styles.sectionDot} />
                <h2 className={styles.sectionTitle}>Rating Breakdown</h2>
              </div>
              <div className={styles.giantRatingRow}>
                <span className={styles.giantRatingNumber}>
                  {REVIEWS_SUMMARY.overallRating}
                </span>
                <div className={styles.ratingStarsMeta}>
                  <div className={styles.starsRow}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className={styles.starFilled} />
                    ))}
                  </div>
                  <span className={styles.totalReviewsCount}>
                    Based on {REVIEWS_SUMMARY.totalReviews} verified client reviews
                  </span>
                </div>
              </div>

              {/* Star Breakdown Progress Bars */}
              <div className={styles.starBreakdownList}>
                {REVIEWS_SUMMARY.starDistribution.map((item) => (
                  <div key={item.stars} className={styles.starBreakdownRow}>
                    <span className={styles.starLabel}>{item.stars}★</span>
                    <div className={styles.starBarBg}>
                      <div
                        className={styles.starBarFill}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className={styles.starCount}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Stats Metrics */}
            <div className={styles.bottomStatsGrid}>
              <div className={styles.bottomStatItem}>
                <span className={styles.bottomStatVal}>
                  {REVIEWS_SUMMARY.recommendationPercent}%
                </span>
                <span className={styles.bottomStatLabel}>recommend</span>
              </div>
              <div className={styles.bottomStatItem}>
                <span className={styles.bottomStatVal}>
                  {REVIEWS_SUMMARY.responseRatePercent}%
                </span>
                <span className={styles.bottomStatLabel}>response rate</span>
              </div>
              <div className={styles.bottomStatItem}>
                <span className={styles.bottomStatVal}>
                  {REVIEWS_SUMMARY.avgReplyTimeHours}h
                </span>
                <span className={styles.bottomStatLabel}>avg. reply time</span>
              </div>
            </div>
          </div>

          {/* Performance Insights Card */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <div>
                <div className={styles.sectionHeader} style={{ marginBottom: 4 }}>
                  <span className={styles.sectionDot} />
                  <h2 className={styles.sectionTitle}>Category Feedback</h2>
                </div>
                <h2 className={styles.cardTitle}>Performance Insights</h2>
              </div>
              <span className={styles.topExpertBadge}>
                <Award size={12} /> {REVIEWS_SUMMARY.badgeLabel}
              </span>
            </div>

            <div className={styles.categoryGrid}>
              {CATEGORY_SCORES.map((cat) => (
                <div key={cat.label} className={styles.categoryItem}>
                  <div className={styles.categoryTopRow}>
                    <span className={styles.categoryName}>{cat.label}</span>
                    <span className={styles.categoryScoreVal}>
                      {cat.score}/{cat.maxScore}
                    </span>
                  </div>
                  <div className={styles.categoryBarBg}>
                    <div
                      className={styles.categoryBarFill}
                      style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------
            4. MIDDLE ROW: RATING TREND & ACHIEVEMENTS
        -------------------------------------------------- */}
        <div className={styles.middleGridRow}>
          {/* Rating Trend Card */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <div>
                <div className={styles.sectionHeader} style={{ marginBottom: 4 }}>
                  <span className={styles.sectionDot} />
                  <h2 className={styles.sectionTitle}>Performance Analytics</h2>
                </div>
                <h2 className={styles.cardTitle}>Rating Trend</h2>
              </div>
              <select
                className={styles.selectDropdown}
                value={trendView}
                onChange={(e) => setTrendView(e.target.value as "daily" | "weekly" | "monthly")}
                aria-label="Select rating trend timeframe"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className={styles.chartSvgWrap}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className={styles.svgElement}
                role="img"
                aria-label="Rating trend chart"
              >
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--pomegranate, #e53b17)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--pomegranate, #e53b17)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Star Rating Gridlines and Labels */}
                {yTicks.map((tick) => {
                  const y = padTop + chartH - ((tick.value - minVal) / range) * chartH;
                  return (
                    <g key={tick.value}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                        stroke="var(--mercury, #e6e6e6)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                        fill="#d97706"
                        fontWeight="700"
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                <path d={areaPath} fill="url(#trendGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--pomegranate, #e53b17)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--pomegranate, #e53b17)"
                    stroke="var(--white, #ffffff)"
                    strokeWidth="2"
                  />
                ))}
              </svg>

              <div className={styles.chartLabelsRow}>
                {pts.map((p, i) => (
                  <span key={i} className={styles.chartLabelText}>
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Net Promoter Score Card (Right Side Beside Graph) */}
          <div className={styles.npsCard}>
            <div>
              <div className={styles.npsHeaderRow}>
                <div>
                  <h2 className={styles.cardTitle}>NPS this month</h2>
                  <span className={styles.chartSubtitle}>Net Promoter Score</span>
                </div>
              </div>

              <div className={styles.npsScoreBlock}>
                <span className={styles.npsBigNumber}>+{NET_PROMOTER_SCORE.score}</span>
                <span className={styles.totalReviewsCount}>
                  Calculated from {NET_PROMOTER_SCORE.totalSurveyed} post-session surveys this month
                </span>
              </div>

              {/* Tri-color Segmented NPS Distribution Bar */}
              <div
                className={styles.npsSegmentedBar}
                role="progressbar"
                aria-label="NPS distribution bar"
              >
                <div
                  className={styles.npsSegmentPromoters}
                  style={{ width: `${NET_PROMOTER_SCORE.promotersPercent}%` }}
                  title={`Promoters (9-10): ${NET_PROMOTER_SCORE.promotersPercent}%`}
                />
                <div
                  className={styles.npsSegmentPassives}
                  style={{ width: `${NET_PROMOTER_SCORE.passivesPercent}%` }}
                  title={`Passives (7-8): ${NET_PROMOTER_SCORE.passivesPercent}%`}
                />
                <div
                  className={styles.npsSegmentDetractors}
                  style={{ width: `${NET_PROMOTER_SCORE.detractorsPercent}%` }}
                  title={`Detractors (0-6): ${NET_PROMOTER_SCORE.detractorsPercent}%`}
                />
              </div>
            </div>

            {/* 3-Column Breakdown: Promoters, Passives, Detractors */}
            <div className={styles.npsBreakdownGrid}>
              <div className={styles.npsBreakdownItem}>
                <span className={styles.npsBreakdownDotLabel}>
                  <span className={styles.npsDotPromoter} /> Promoters (9-10)
                </span>
                <span className={styles.npsBreakdownVal}>
                  {NET_PROMOTER_SCORE.promotersPercent}%
                </span>
                <span className={styles.npsBreakdownCount}>
                  {NET_PROMOTER_SCORE.promotersCount} clients
                </span>
              </div>

              <div className={styles.npsBreakdownItem}>
                <span className={styles.npsBreakdownDotLabel}>
                  <span className={styles.npsDotPassive} /> Passives (7-8)
                </span>
                <span className={styles.npsBreakdownVal}>
                  {NET_PROMOTER_SCORE.passivesPercent}%
                </span>
                <span className={styles.npsBreakdownCount}>
                  {NET_PROMOTER_SCORE.passivesCount} clients
                </span>
              </div>

              <div className={styles.npsBreakdownItem}>
                <span className={styles.npsBreakdownDotLabel}>
                  <span className={styles.npsDotDetractor} /> Detractors (0-6)
                </span>
                <span className={styles.npsBreakdownVal}>
                  {NET_PROMOTER_SCORE.detractorsPercent}%
                </span>
                <span className={styles.npsBreakdownCount}>
                  {NET_PROMOTER_SCORE.detractorsCount} clients
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------
            6. BOTTOM SECTION: CLIENT REVIEWS FEED
        -------------------------------------------------- */}
        <div className={styles.reviewsCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDot} />
            <h2 className={styles.sectionTitle}>Client Testimonials</h2>
          </div>

          <div className={styles.filterTabsRow}>
            <div className={styles.tabsGroup}>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`${styles.tabBtn} ${
                  activeTab === "all" ? styles.tabBtnActive : ""
                }`}
              >
                All Reviews <span className={styles.tabBadge}>({reviews.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("needsReply")}
                className={`${styles.tabBtn} ${
                  activeTab === "needsReply" ? styles.tabBtnActive : ""
                }`}
              >
                Needs Reply{" "}
                <span className={styles.tabBadge}>
                  ({reviews.filter((r) => r.status === "Needs Reply").length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fiveStar")}
                className={`${styles.tabBtn} ${
                  activeTab === "fiveStar" ? styles.tabBtnActive : ""
                }`}
              >
                5 Stars
              </button>
            </div>

            <select className={styles.selectDropdown} defaultValue="recent">
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          {/* Reviews List */}
          <div className={styles.reviewsList}>
            {filteredReviews.map((rev) => (
              <div key={rev.id} className={styles.reviewItemCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewClientLeft}>
                    <div className={styles.avatarWrapper}>
                      <img
                        src={rev.avatar}
                        alt={rev.clientName}
                        className={styles.reviewAvatar}
                      />
                    </div>
                    <div className={styles.reviewClientMeta}>
                      <div className={styles.reviewClientNameRow}>
                        <span className={styles.reviewClientName}>{rev.clientName}</span>
                        {rev.status === "Replied" ? (
                          <span className={styles.badgeReplied}>
                            <CheckCircle2 size={10} /> Replied
                          </span>
                        ) : (
                          <span className={styles.badgeNeedsReply}>
                            <Clock size={10} /> Needs Reply
                          </span>
                        )}
                      </div>
                      <span className={styles.reviewClientRole}>
                        {rev.sessionTitle} · {rev.date}
                      </span>
                    </div>
                  </div>

                  <div className={styles.reviewRatingRight}>
                    <div className={styles.starsRow}>
                      {[...Array(Math.floor(rev.rating))].map((_, i) => (
                        <Star key={i} size={14} className={styles.starFilled} />
                      ))}
                    </div>
                    <span>{rev.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className={styles.reviewCommentText}>"{rev.comment}"</p>

                <div className={styles.reviewKeywordsRow}>
                  {rev.tags.map((tag) => (
                    <span key={tag} className={styles.keywordChip}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Expert Reply Display */}
                {rev.reply && (
                  <div className={styles.expertReplyBox}>
                    <div className={styles.replyHeaderRow}>
                      <span className={styles.replyAuthor}>Your Response</span>
                      <span className={styles.replyDate}>{rev.reply.date}</span>
                    </div>
                    <p className={styles.replyText}>"{rev.reply.text}"</p>
                  </div>
                )}

                {/* Inline Reply Form or Trigger Button */}
                {!rev.reply && (
                  <>
                    {activeReplyId === rev.id ? (
                      <div className={styles.replyFormBox}>
                        <span className={styles.replyFormTitle}>
                          Write a response to {rev.clientName.split(" ")[0]}...
                        </span>
                        <textarea
                          rows={3}
                          placeholder={`Thank ${
                            rev.clientName.split(" ")[0]
                          } for the feedback and add a personal note...`}
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          className={styles.replyTextarea}
                        />
                        <div className={styles.replyFormActions}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyId(null);
                              setReplyInput("");
                            }}
                            className={styles.cancelBtn}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitReply(rev.id)}
                            className={styles.submitReplyBtn}
                          >
                            <Send size={12} /> Send Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(rev.id);
                          setReplyInput("");
                        }}
                        className={styles.triggerReplyBtn}
                      >
                        <MessageSquare size={14} /> Write a Response
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
