"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Gift,
  Info,
  LineChart,
  Monitor,
  Percent,
  Plus,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { getSeekerById } from "@/lib/adminUserManagement";
import styles from "./FinancialInsightsView.module.css";

type FinancialInsightsViewProps = {
  userId: string;
};

type SessionType = "all" | "call" | "video" | "text";

type MonthData = {
  name: string;
  call: number;
  video: number;
  text: number;
};

type Offer = {
  id: string;
  code: string;
  type: "percent" | "flat" | "cashback";
  value: number;
  targetCategory: string;
  targetSessionType: string;
  status: "Active" | "Redeemed" | "Expired";
  expiryDate: string;
  dateCreated: string;
  redemptions: number;
  description: string;
};

export default function FinancialInsightsView({ userId }: FinancialInsightsViewProps) {
  const seeker = getSeekerById(userId);

  // States
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>("all");
  const [timeframe, setTimeframe] = useState<"6" | "12" | "3">("6");
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  // Offer Generator State
  const [offerPreset, setOfferPreset] = useState<string>("custom");
  const [couponCode, setCouponCode] = useState<string>("");
  const [offerType, setOfferType] = useState<"percent" | "flat" | "cashback">("percent");
  const [offerValue, setOfferValue] = useState<number>(15);
  const [targetCategory, setTargetCategory] = useState<string>("All Categories");
  const [targetSessionType, setTargetSessionType] = useState<string>("All Sessions");
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [offerMsg, setOfferMsg] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Offers List State (in-memory mock database that changes dynamically)
  const [offers, setOffers] = useState<Offer[]>([
    {
      id: "off-1",
      code: "WELCOME200",
      type: "flat",
      value: 200,
      targetCategory: "All Categories",
      targetSessionType: "All Sessions",
      status: "Active",
      expiryDate: "Sep 30, 2026",
      dateCreated: "Aug 01, 2026",
      redemptions: 0,
      description: "Flat ₹200 discount for first-time premium users on the platform.",
    },
    {
      id: "off-2",
      code: "ASTROVIP25",
      type: "percent",
      value: 25,
      targetCategory: "Vedic Astrology",
      targetSessionType: "Live Calls",
      status: "Active",
      expiryDate: "Oct 15, 2026",
      dateCreated: "Aug 20, 2026",
      redemptions: 1,
      description: "25% discount on Vedic Astrology Live Calls for active seekers.",
    }
  ]);

  // Seeker Specific Mock Data Generator
  const totalSpent = seeker?.totalSpent || 0;

  const rawMonthlyData: MonthData[] = useMemo(() => {
    if (totalSpent === 0) {
      return [
        { name: "Jan", call: 0, video: 0, text: 0 },
        { name: "Feb", call: 0, video: 0, text: 0 },
        { name: "Mar", call: 0, video: 0, text: 0 },
        { name: "Apr", call: 0, video: 0, text: 0 },
        { name: "May", call: 0, video: 0, text: 0 },
        { name: "Jun", call: 0, video: 0, text: 0 },
      ];
    }

    // Distribute totalSpent proportionally across months to make it realistic
    // Aarav sk-1 spent 18500
    // Sneha sk-4 spent 34000
    const factor = totalSpent / 18500;
    return [
      { name: "Jan", call: Math.round(1200 * factor), video: Math.round(800 * factor), text: Math.round(500 * factor) },
      { name: "Feb", call: Math.round(1800 * factor), video: Math.round(1200 * factor), text: Math.round(800 * factor) },
      { name: "Mar", call: Math.round(800 * factor), video: Math.round(400 * factor), text: Math.round(300 * factor) },
      { name: "Apr", call: Math.round(2200 * factor), video: Math.round(1100 * factor), text: Math.round(900 * factor) },
      { name: "May", call: Math.round(1600 * factor), video: Math.round(900 * factor), text: Math.round(600 * factor) },
      { name: "Jun", call: Math.round(1900 * factor), video: Math.round(1000 * factor), text: Math.round(500 * factor) },
    ];
  }, [totalSpent]);

  // Filter timeframe
  const monthlyData = useMemo(() => {
    if (timeframe === "3") {
      return rawMonthlyData.slice(3); // Apr, May, Jun
    }
    return rawMonthlyData; // 6 months (currently maximum in mock data)
  }, [rawMonthlyData, timeframe]);

  // Get active values for Y-axis rendering
  const activeSeries = useMemo(() => {
    return monthlyData.map((d) => {
      if (selectedSessionType === "call") return d.call;
      if (selectedSessionType === "video") return d.video;
      if (selectedSessionType === "text") return d.text;
      return d.call + d.video + d.text; // all
      return d.call + d.video + d.text;
    });
  }, [monthlyData, selectedSessionType]);

  const maxVal = useMemo(() => {
    const val = Math.max(...activeSeries, 100);
    return Math.ceil(val / 500) * 500;
  }, [activeSeries]);

  const svgW = 800;
  const svgH = 220;
  const paddingX = 50;
  const paddingY = 25;
  const chartW = svgW - paddingX * 2;
  const chartH = svgH - paddingY * 2;

  const points = useMemo(() => {
    if (activeSeries.length === 0) return [];
    return activeSeries.map((val, idx) => {
      const x = paddingX + (idx / (activeSeries.length - 1)) * chartW;
      const ratio = val / maxVal;
      const y = svgH - paddingY - ratio * chartH;
      return { x, y, val };
    });
  }, [activeSeries, maxVal, chartW, chartH]);

  const areaPathString = useMemo(() => {
    if (points.length === 0) return "";
    let str = `M ${points[0].x} ${svgH - paddingY}`;
    points.forEach((p) => {
      str += ` L ${p.x} ${p.y}`;
    });
    str += ` L ${points[points.length - 1].x} ${svgH - paddingY} Z`;
    return str;
  }, [points]);

  const linePathString = useMemo(() => {
    if (points.length === 0) return "";
    let str = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cpX1 = p1.x + (p2.x - p1.x) / 3;
      const cpY1 = p1.y;
      const cpX2 = p1.x + 2 * (p2.x - p1.x) / 3;
      const cpY2 = p2.y;
      str += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p2.x} ${p2.y}`;
    }
    return str;
  }, [points]);

  const averageOrderValue = useMemo(() => {
    if (!seeker?.totalBookings || seeker.totalBookings === 0) return 0;
    return Math.round(totalSpent / seeker.totalBookings);
  }, [totalSpent, seeker]);

  const churnRisk = useMemo(() => {
    if (!seeker || seeker.totalBookings === 0) return { score: "Critical", class: styles.riskHigh, label: "High Risk (Inactive)" };
    if (seeker.status === "suspended") return { score: "N/A", class: styles.riskMuted, label: "Account Suspended" };
    if (seeker.totalBookings < 3) return { score: "High", class: styles.riskHigh, label: "High Risk (Low Engagement)" };
    if (seeker.totalBookings < 8) return { score: "Medium", class: styles.riskMedium, label: "Moderate Risk" };
    return { score: "Low", class: styles.riskLow, label: "Healthy Retention" };
  }, [seeker]);

  const priceTierAffinity = useMemo(() => {
    if (userId === "skr-1") return { budget: 20, standard: 50, premium: 30 };
    if (userId === "skr-4") return { budget: 10, standard: 40, premium: 50 };
    return { budget: 40, standard: 40, premium: 20 };
  }, [userId]);

  const themeColor = useMemo(() => {
    if (selectedSessionType === "call") return "#22c55e";
    if (selectedSessionType === "video") return "#a855f7";
    if (selectedSessionType === "text") return "#3b82f6";
    return "#e9681e";
  }, [selectedSessionType]);

  // Set preset configs
  const handleSelectPreset = (preset: string) => {
    setOfferPreset(preset);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const seekerNamePrefix = seeker?.name.split(" ")[0].toUpperCase() || "SKR";

    if (preset === "reengage") {
      setCouponCode(`COMEBACK-${seekerNamePrefix}-${randomSuffix}`);
      setOfferType("flat");
      setOfferValue(150);
      setTargetCategory("All Categories");
      setTargetSessionType("All Sessions");
      setExpiryDays(15);
      setOfferMsg("We miss your consulting sessions! Here is a flat ₹150 credit for your next booking.");
    } else if (preset === "upgrade") {
      setCouponCode(`LIVEUPGRADE-${seekerNamePrefix}`);
      setOfferType("percent");
      setOfferValue(25);
      setTargetCategory("All Categories");
      setTargetSessionType("Live Calls");
      setExpiryDays(10);
      setOfferMsg("Take your consultations live. Enjoy 25% off on your first Live Call session.");
    } else if (preset === "cross_sell") {
      setCouponCode(`TRYVASTU-${seekerNamePrefix}`);
      setOfferType("percent");
      setOfferValue(20);
      setTargetCategory("Vastu Shastra");
      setTargetSessionType("All Sessions");
      setExpiryDays(30);
      setOfferMsg("Discover Vastu tips for home alignment. 20% discount on Vastu Shastra consultation.");
    } else if (preset === "custom") {
      setCouponCode("");
      setOfferValue(10);
      setOfferMsg("");
    }
  };

  // Generate & Add Offer
  const handleGenerateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;

    setIsGenerating(true);

    setTimeout(() => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedExpiry = `${months[expiryDate.getMonth()]} ${expiryDate.getDate()}, ${expiryDate.getFullYear()}`;
      
      const today = new Date();
      const formattedCreated = `${months[today.getMonth()]} ${String(today.getDate()).padStart(2, "0")}, ${today.getFullYear()}`;

      const newOffer: Offer = {
        id: `off-${Date.now()}`,
        code: couponCode.trim().toUpperCase(),
        type: offerType,
        value: offerValue,
        targetCategory,
        targetSessionType,
        status: "Active",
        expiryDate: formattedExpiry,
        dateCreated: formattedCreated,
        redemptions: 0,
        description: offerMsg || `${offerType === "percent" ? `${offerValue}%` : `₹${offerValue}`} off on ${targetCategory} ${targetSessionType}.`,
      };

      setOffers((prev) => [newOffer, ...prev]);
      setIsGenerating(false);
      
      // Reset form
      setCouponCode("");
      setOfferMsg("");
      setOfferPreset("custom");
    }, 800);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  return (
    <div className={styles.insightsView}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiBox}>
          <div className={styles.kpiHeadRow}>
            <span className={styles.kpiLabel}>Average Order Value (AOV)</span>
            <span className={styles.iconTag} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
              <TrendingUp size={14} />
            </span>
          </div>
          <h2 className={styles.kpiNumber}>₹{averageOrderValue.toLocaleString("en-IN")}</h2>
          <div className={styles.kpiDetailRow}>
            <span>Per Consultation</span>
            <span style={{ color: "#16a34a", fontWeight: 600 }}>Healthy ticket size</span>
          </div>
        </div>

        <div className={styles.kpiBox}>
          <div className={styles.kpiHeadRow}>
            <span className={styles.kpiLabel}>Churn &amp; Drop-off Risk</span>
            <span className={styles.iconTag} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
              <UserCheck size={14} />
            </span>
          </div>
          <h2 className={`${styles.kpiNumber} ${churnRisk.class}`}>{churnRisk.score}</h2>
          <div className={styles.kpiDetailRow}>
            <span>{churnRisk.label}</span>
            <span>Avg. 14 days gap</span>
          </div>
        </div>

        <div className={styles.kpiBox}>
          <div className={styles.kpiHeadRow}>
            <span className={styles.kpiLabel}>Consultant Tier Preference</span>
            <span className={styles.iconTag} style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}>
              <Zap size={14} />
            </span>
          </div>
          <div className={styles.tierSplitBar}>
            <div className={styles.tierBudget} style={{ width: `${priceTierAffinity.budget}%` }} title={`Budget: ${priceTierAffinity.budget}%`} />
            <div className={styles.tierStandard} style={{ width: `${priceTierAffinity.standard}%` }} title={`Standard: ${priceTierAffinity.standard}%`} />
            <div className={styles.tierPremium} style={{ width: `${priceTierAffinity.premium}%` }} title={`Premium: ${priceTierAffinity.premium}%`} />
          </div>
          <div className={styles.tierLegendRow}>
            <span className={styles.tierText}><span className={`${styles.miniDot} ${styles.colorBudget}`} /> Budget ({priceTierAffinity.budget}%)</span>
            <span className={styles.tierText}><span className={`${styles.miniDot} ${styles.colorStandard}`} /> Standard ({priceTierAffinity.standard}%)</span>
            <span className={styles.tierText}><span className={`${styles.miniDot} ${styles.colorPremium}`} /> Premium ({priceTierAffinity.premium}%)</span>
          </div>
        </div>

        <div className={styles.kpiBox}>
          <div className={styles.kpiHeadRow}>
            <span className={styles.kpiLabel}>Wallet Top-up Affinity</span>
            <span className={styles.iconTag} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}>
              <Gift size={14} />
            </span>
          </div>
          <h2 className={styles.kpiNumber}>{seeker?.totalBookings && seeker.totalBookings > 4 ? "82%" : "40%"}</h2>
          <div className={styles.kpiDetailRow}>
            <span>Of orders paid via Wallet</span>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>High loyalty</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Session Spending Timeline</h3>
            <p className={styles.cardSubtitle}>Monthly financial value generated by seeker</p>
          </div>
          
          <div className={styles.filterRow}>
            <div className={styles.selectWrapper}>
              <select
                value={selectedSessionType}
                onChange={(e) => setSelectedSessionType(e.target.value as SessionType)}
                className={styles.dropdown}
              >
                <option value="all">All Session Types</option>
                <option value="call">Live Calls</option>
                <option value="video">Video Messages</option>
                <option value="text">Text Sessions</option>
              </select>
            </div>

            <div className={styles.timeToggler}>
              <button
                type="button"
                onClick={() => setTimeframe("3")}
                className={`${styles.timeBtn} ${timeframe === "3" ? styles.timeBtnActive : ""}`}
              >
                3M
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("6")}
                className={`${styles.timeBtn} ${timeframe === "6" ? styles.timeBtnActive : ""}`}
              >
                6M
              </button>
            </div>
          </div>
        </div>

        <div className={styles.chartWrapper}>
          <svg
            width="100%"
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            className={styles.svgContainer}
          >
            <defs>
              <linearGradient id="gradient-all" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e9681e" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#e9681e" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="gradient-call" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="gradient-video" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="gradient-text" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const y = paddingY + r * chartH;
              const value = Math.round(maxVal * (1 - r));
              return (
                <g key={i} className={styles.gridGroup}>
                  <line x1={paddingX} y1={y} x2={svgW - paddingX} y2={y} className={styles.gridLine} />
                  <text x={paddingX - 10} y={y + 4} textAnchor="end" className={styles.yAxisLabel}>
                    ₹{value}
                  </text>
                </g>
              );
            })}

            <path
              d={areaPathString}
              fill={`url(#gradient-${selectedSessionType})`}
              className={styles.areaPath}
            />

            <path
              d={linePathString}
              stroke={themeColor}
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              className={styles.linePath}
            />

            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={activeTooltipIndex === idx ? "7" : "5"}
                  fill={themeColor}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className={styles.chartDot}
                  onMouseEnter={() => setActiveTooltipIndex(idx)}
                  onMouseLeave={() => setActiveTooltipIndex(null)}
                />
                {activeTooltipIndex === idx && (
                  <g>
                    <rect
                      x={p.x - 45}
                      y={p.y - 38}
                      width="90"
                      height="26"
                      rx="6"
                      fill="#080a10"
                      className={styles.tooltipBg}
                    />
                    <text
                      x={p.x}
                      y={p.y - 21}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="var(--font-ibm-plex-mono)"
                    >
                      ₹{p.val.toLocaleString()}
                    </text>
                  </g>
                )}
              </g>
            ))}

            {monthlyData.map((d, idx) => {
              const x = paddingX + (idx / (monthlyData.length - 1)) * chartW;
              return (
                <text
                  key={idx}
                  x={x}
                  y={svgH - paddingY + 16}
                  textAnchor="middle"
                  className={styles.xAxisLabel}
                >
                  {d.name}
                </text>
              );
            })}
          </svg>
        </div>

        <div className={styles.legendGrid}>
          <div className={styles.legendDotItem}>
            <span className={styles.dot} style={{ background: "#e9681e" }} />
            <span className={styles.legendText}>Combined Spend (Total: ₹{totalSpent.toLocaleString("en-IN")})</span>
          </div>
          <div className={styles.legendDotGroup}>
            <div className={styles.legendDotItem}>
              <span className={styles.dot} style={{ background: "#22c55e" }} />
              <span>Calls</span>
            </div>
            <div className={styles.legendDotItem}>
              <span className={styles.dot} style={{ background: "#a855f7" }} />
              <span>Video</span>
            </div>
            <div className={styles.legendDotItem}>
              <span className={styles.dot} style={{ background: "#3b82f6" }} />
              <span>Text</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.offerCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.offerIconWrap}>
                <Gift size={20} />
              </div>
              <div>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Personalized Offer Generator</h3>
                <p className={styles.cardSubtitle} style={{ marginTop: "2px" }}>
                  Create coupon codes or wallet bonuses tailored to seeker behavior
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateOffer} className={styles.offerForm}>
            
            {/* Presets Segmented Selector */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Smart Preset Strategy</label>
              <div className={styles.presetButtons}>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("reengage")}
                  className={`${styles.presetBtn} ${offerPreset === "reengage" ? styles.presetBtnActive : ""}`}
                >
                  <RotateCcw size={14} />
                  <span>Re-engage</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("upgrade")}
                  className={`${styles.presetBtn} ${offerPreset === "upgrade" ? styles.presetBtnActive : ""}`}
                >
                  <Zap size={14} />
                  <span>Live Upgrade</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("cross_sell")}
                  className={`${styles.presetBtn} ${offerPreset === "cross_sell" ? styles.presetBtnActive : ""}`}
                >
                  <TrendingUp size={14} />
                  <span>Cross-sell</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("custom")}
                  className={`${styles.presetBtn} ${offerPreset === "custom" ? styles.presetBtnActive : ""}`}
                >
                  <SlidersHorizontal size={14} />
                  <span>Custom</span>
                </button>
              </div>
            </div>

            {/* Offer Model Type Selection */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Offer Model Type</label>
              <div className={styles.typeRadioGroup}>
                <label className={`${styles.typeRadioLabel} ${offerType === "percent" ? styles.radioSelected : ""}`}>
                  <input
                    type="radio"
                    name="offerType"
                    checked={offerType === "percent"}
                    onChange={() => setOfferType("percent")}
                    className={styles.hiddenRadio}
                  />
                  <Percent size={15} />
                  <span>Percentage</span>
                </label>

                <label className={`${styles.typeRadioLabel} ${offerType === "flat" ? styles.radioSelected : ""}`}>
                  <input
                    type="radio"
                    name="offerType"
                    checked={offerType === "flat"}
                    onChange={() => setOfferType("flat")}
                    className={styles.hiddenRadio}
                  />
                  <Tag size={15} />
                  <span>Flat Discount</span>
                </label>

                <label className={`${styles.typeRadioLabel} ${offerType === "cashback" ? styles.radioSelected : ""}`}>
                  <input
                    type="radio"
                    name="offerType"
                    checked={offerType === "cashback"}
                    onChange={() => setOfferType("cashback")}
                    className={styles.hiddenRadio}
                  />
                  <Gift size={15} />
                  <span>Cashback</span>
                </label>
              </div>
            </div>

            {/* Code and Value */}
            <div className={styles.formRow}>
              <div className={styles.formCol}>
                <label className={styles.fieldLabel}>Promo Coupon Code</label>
                <div className={styles.codeWrap}>
                  <Tag size={15} className={styles.inputLeftIcon} />
                  <input
                    type="text"
                    required
                    placeholder="E.g. JTY-PREMIUM"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className={styles.formInput}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                      const prefix = seeker?.name.split(" ")[0].toUpperCase() || "SKR";
                      setCouponCode(`JTY-${prefix}-${randomSuffix}`);
                    }}
                    className={styles.btnGenerateCode}
                    title="Generate random code"
                  >
                    Auto Generate
                  </button>
                </div>
              </div>

              <div className={styles.formCol}>
                <label className={styles.fieldLabel}>
                  {offerType === "percent" ? "Discount Percentage" : "Discount Value"}
                </label>
                <div className={styles.valueInputWrap}>
                  <input
                    type="number"
                    required
                    min="1"
                    value={offerValue}
                    onChange={(e) => setOfferValue(parseInt(e.target.value) || 0)}
                    className={styles.formInput}
                    style={{ paddingRight: "36px" }}
                  />
                  <span className={styles.valueTypeSuffix}>
                    {offerType === "percent" ? "%" : "₹"}
                  </span>
                </div>
              </div>
            </div>

            {/* Targets and Expiry */}
            <div className={styles.formRow}>
              <div className={styles.formCol}>
                <label className={styles.fieldLabel}>Target Category</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Vedic Astrology">Vedic Astrology</option>
                  <option value="Vastu Shastra">Vastu Shastra</option>
                  <option value="Numerology & Tarot">Numerology &amp; Tarot</option>
                  <option value="Mindfulness & Therapy">Mindfulness &amp; Therapy</option>
                </select>
              </div>

              <div className={styles.formCol}>
                <label className={styles.fieldLabel}>Validity Window</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className={styles.formSelect}
                >
                  <option value={7}>7 Days (Urgent)</option>
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days (Standard)</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>
            </div>

            {/* Custom description */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Personalized Notification Message</label>
              <textarea
                rows={2}
                placeholder="Write a custom notification message to show the seeker..."
                value={offerMsg}
                onChange={(e) => setOfferMsg(e.target.value)}
                className={styles.formTextarea}
              />
            </div>

            {/* Live Voucher Preview */}
            {couponCode && (
              <div className={styles.voucherPreview}>
                <div className={styles.voucherPreviewHeader}>
                  <span className={styles.voucherPreviewLabel}>VOUCHER PREVIEW</span>
                  <span className={styles.voucherCodeBadge}>{couponCode}</span>
                </div>
                <div className={styles.voucherPreviewDesc}>
                  <strong>
                    {offerType === "percent" ? `${offerValue}% OFF` : `₹${offerValue} OFF`}
                  </strong>
                  <span> • </span>
                  <span>{targetCategory}</span>
                  <span> • </span>
                  <span>Valid for {expiryDays} days</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating || !couponCode}
              className={styles.btnSubmitOffer}
            >
              {isGenerating ? (
                <span>Generating and Dispatching...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Issue Personalized Offer</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Offers Table List */}
        <div className={styles.card} style={{ marginTop: "24px" }}>
        <div className={styles.offersHeaderRow}>
          <div>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Active Targeted Offers</h3>
            <p className={styles.cardSubtitle}>Directly generated promo actions for this seeker account</p>
          </div>
          <span className={styles.activeOffersCount}>
            {offers.filter(o => o.status === "Active").length} Active Coupons
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.offersTable}>
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Type &amp; Value</th>
                <th>Target Restrictions</th>
                <th>Offer Message / Details</th>
                <th>Created Date</th>
                <th>Expiry Date</th>
                <th>Redeemed</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td className={styles.tdCode}>
                    <code className={styles.code}>{offer.code}</code>
                  </td>
                  <td>
                    <span className={styles.badgeValue}>
                      {offer.type === "percent" ? `${offer.value}% OFF` : offer.type === "flat" ? `₹${offer.value} OFF` : `₹${offer.value} Cashback`}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "14px", fontWeight: 500, display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Tag size={12} style={{ color: "var(--dove-gray)" }} />
                        <span>{offer.targetCategory}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--dove-gray)", fontSize: "13px" }}>
                        <Monitor size={12} style={{ color: "var(--dove-gray)" }} />
                        <span>{offer.targetSessionType}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ maxWidth: "250px", fontSize: "14px", color: "var(--dove-gray)" }}>
                    {offer.description}
                  </td>
                  <td style={{ fontSize: "14px" }}>{offer.dateCreated}</td>
                  <td style={{ fontSize: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} style={{ color: "var(--dove-gray)" }} />
                      {offer.expiryDate}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{offer.redemptions}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${offer.status === "Active" ? styles.statusActive : offer.status === "Redeemed" ? styles.statusRedeemed : styles.statusExpired}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(offer.id, offer.code)}
                      className={styles.copyBtn}
                    >
                      {copiedCodeId === offer.id ? (
                        <CheckCircle size={14} style={{ color: "#16a34a" }} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
