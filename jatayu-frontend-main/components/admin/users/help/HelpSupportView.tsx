"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  HelpCircle,
  Headphones,
  IndianRupee,
  LifeBuoy,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Video,
  Zap,
} from "lucide-react";
import styles from "./HelpSupportView.module.css";

type OpenCaseItem = {
  id: string;
  title: string;
  badge: string;
  badgeClass: string;
  caseNo: string;
  openedTime: string;
  category: string;
  updatedTime: string;
  statusText: string;
  statusColor: string;
  icon: any;
  iconBg: string;
  iconColor: string;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: "booking" | "payments" | "experts" | "account" | "refunds";
};

export default function HelpSupportView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [faqFilter, setFaqFilter] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");

  const openCases: OpenCaseItem[] = [
    {
      id: "case-1",
      title: "Refund not received for cancelled booking",
      badge: "In Progress",
      badgeClass: styles.tagBlue,
      caseNo: "Case #JT-2024-08741",
      openedTime: "Opened 2 days ago",
      category: "Payment & Refunds",
      updatedTime: "Last updated 5 hrs ago",
      statusText: "Agent assigned",
      statusColor: "#16a34a",
      icon: IndianRupee,
      iconBg: "rgba(59, 130, 246, 0.12)",
      iconColor: "#2563eb",
    },
    {
      id: "case-2",
      title: "Video response quality was very poor",
      badge: "Awaiting Review",
      badgeClass: styles.tagOrange,
      caseNo: "Case #JT-2024-08895",
      openedTime: "Opened 5 days ago",
      category: "Session Quality",
      updatedTime: "Last updated 1 day ago",
      statusText: "Pending expert response",
      statusColor: "#d97706",
      icon: Video,
      iconBg: "rgba(168, 85, 247, 0.12)",
      iconColor: "#9333ea",
    },
  ];

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      question: "How do I cancel a booking and get a refund?",
      answer: "You can cancel any scheduled consultation up to 2 hours before the start time directly from your Booking History. Refunds are automatically processed back to your Jatayu Wallet or original payment method within 24-48 hours.",
      category: "booking",
    },
    {
      id: "faq-2",
      question: "My UPI payment failed but amount was deducted. What now?",
      answer: "Banking gateways usually auto-reverse failed transactions within 3-5 business days. If the amount is not credited back, please share your UPI Transaction Reference ID via our Support Ticket option below.",
      category: "payments",
    },
    {
      id: "faq-3",
      question: "What if the expert doesn't respond within the SLA?",
      answer: "If an expert fails to deliver a text or video response within the committed timeframe, your credits/funds are 100% refunded to your Jatayu Wallet immediately with zero deduction.",
      category: "experts",
    },
    {
      id: "faq-4",
      question: "I'm not receiving the WhatsApp OTP. What should I do?",
      answer: "Ensure your mobile number is registered with WhatsApp. You can also click 'Resend via SMS' on the verification screen after 30 seconds.",
      category: "account",
    },
    {
      id: "faq-5",
      question: "How do Jatayu Credits work? Do they expire?",
      answer: "Pro monthly credits expire at the end of each billing cycle. Refund credits and purchased wallet funds remain valid for 90 days to 1 year as per platform policies.",
      category: "refunds",
    },
    {
      id: "faq-6",
      question: "Can I reschedule a live call booking?",
      answer: "Yes! You can request a time slot change up to 4 hours before the live session starts from your active booking card.",
      category: "booking",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    if (faqFilter !== "all" && faq.category !== faqFilter) return false;
    if (searchQuery.trim() !== "") {
      return (
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className={styles.helpView}>
      {/* 1. Header Row */}
      <div className={styles.helpHeaderRow}>
        <div>
          <h2 className={styles.helpPageTitle}>Help &amp; Support</h2>
          <p className={styles.helpPageSubtitle}>Find answers, track tickets, or contact our support team</p>
        </div>

        <button type="button" className={styles.btnCreateCaseTop}>
          <Plus size={16} /> Create Support Case
        </button>
      </div>

      {/* 2. Dark Navy Hero Banner Card */}
      <div className={styles.helpHeroBanner}>
        <span className={styles.helpTagline}>HELP CENTER</span>
        <h2 className={styles.helpHeroTitle}>How can we help you today?</h2>

        <div className={styles.helpSearchBox}>
          <Search size={18} className={styles.searchIconLeft} />
          <input
            type="text"
            className={styles.helpSearchInput}
            placeholder="Search for booking issues, payment help, refunds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className={styles.helpSearchBtn}>
            Search
          </button>
        </div>

        <div className={styles.popularSearchPills}>
          <span className={styles.popularLabel}>Popular:</span>
          <button type="button" className={styles.pillBtn} onClick={() => setSearchQuery("Cancel booking")}>
            Cancel booking
          </button>
          <button type="button" className={styles.pillBtn} onClick={() => setSearchQuery("Refund status")}>
            Refund status
          </button>
          <button type="button" className={styles.pillBtn} onClick={() => setSearchQuery("Expert not responding")}>
            Expert not responding
          </button>
          <button type="button" className={styles.pillBtn} onClick={() => setSearchQuery("Payment failed")}>
            Payment failed
          </button>
        </div>
      </div>

      {/* 3. Your Open Cases Card */}
      <div className={styles.openCasesCard}>
        <div className={styles.casesHeaderRow}>
          <div className={styles.casesTitleGroup}>
            <FileText size={18} style={{ color: "var(--tango)" }} />
            <div>
              <h3 className={styles.subTitle}>Your Open Cases</h3>
              <p className={styles.subSubtitle}>Track and manage your active support tickets</p>
            </div>
          </div>
          <span className={styles.openBadge}>2 Open</span>
        </div>

        <div className={styles.casesList}>
          {openCases.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.id} className={styles.caseItemRow}>
                <div className={styles.caseLeft}>
                  <div className={styles.caseIconBox} style={{ background: c.iconBg, color: c.iconColor }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className={styles.caseTitleRow}>
                      <h4 className={styles.caseTitle}>{c.title}</h4>
                      <span className={c.badgeClass}>{c.badge}</span>
                    </div>
                    <div className={styles.caseMeta}>
                      {c.caseNo} · {c.openedTime} · {c.category}
                    </div>
                    <div className={styles.caseSubmeta}>
                      <Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {c.updatedTime} ·{" "}
                      <span style={{ color: c.statusColor, fontWeight: 600 }}>● {c.statusText}</span>
                    </div>
                  </div>
                </div>
                <button type="button" className={styles.btnViewCase}>
                  View
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.casesFooterRow}>
          <span style={{ fontSize: "12px", color: "var(--dove-gray)" }}>3 resolved cases in the last 30 days</span>
          <button type="button" className={styles.linkViewAll}>
            View All Cases →
          </button>
        </div>
      </div>

      {/* 4. Browse Help Topics Section */}
      <div className={styles.topicsSection}>
        <h3 className={styles.sectionHeaderTitle}>BROWSE HELP TOPICS</h3>

        <div className={styles.topicsGrid}>
          {/* Topic 1 */}
          <div className={styles.topicCard}>
            <div className={styles.topicIcon} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
              <Calendar size={20} />
            </div>
            <h4 className={styles.topicTitle}>Booking Help</h4>
            <p className={styles.topicDesc}>Cancel, reschedule, or fix booking issues</p>
            <div className={styles.topicLink}>
              12 articles <span>→</span>
            </div>
          </div>

          {/* Topic 2 */}
          <div className={styles.topicCard}>
            <div className={styles.topicIcon} style={{ background: "rgba(34, 197, 94, 0.12)", color: "#16a34a" }}>
              <IndianRupee size={20} />
            </div>
            <h4 className={styles.topicTitle}>Payment &amp; Refunds</h4>
            <p className={styles.topicDesc}>UPI failures, wallet credits, refund status</p>
            <div className={styles.topicLink}>
              18 articles <span>→</span>
            </div>
          </div>

          {/* Topic 3 */}
          <div className={styles.topicCard}>
            <div className={styles.topicIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#9333ea" }}>
              <UserCheck size={20} />
            </div>
            <h4 className={styles.topicTitle}>Expert Issues</h4>
            <p className={styles.topicDesc}>No response, poor quality, disputes</p>
            <div className={styles.topicLink}>
              9 articles <span>→</span>
            </div>
          </div>

          {/* Topic 4 */}
          <div className={styles.topicCard}>
            <div className={styles.topicIcon} style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}>
              <ShieldAlert size={20} />
            </div>
            <h4 className={styles.topicTitle}>Safety &amp; Trust</h4>
            <p className={styles.topicDesc}>Report abuse, fraud, inappropriate content</p>
            <div className={styles.topicLink} style={{ color: "#dc2626" }}>
              7 articles <span>→</span>
            </div>
          </div>

          {/* Topic 5 */}
          <div className={styles.topicCard}>
            <div className={styles.topicIcon} style={{ background: "rgba(234, 179, 8, 0.12)", color: "#d97706" }}>
              <LifeBuoy size={20} />
            </div>
            <h4 className={styles.topicTitle}>Account Help</h4>
            <p className={styles.topicDesc}>Login, OTP, profile, verification issues</p>
            <div className={styles.topicLink} style={{ color: "#d97706" }}>
              11 articles <span>→</span>
            </div>
          </div>

          {/* Topic 6 */}
          <div className={styles.topicCard}>
            <div className={styles.topicIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
              <Crown size={20} />
            </div>
            <h4 className={styles.topicTitle}>Pro &amp; Subscription</h4>
            <p className={styles.topicDesc}>Billing, plan changes, Pro benefits</p>
            <div className={styles.topicLink} style={{ color: "#4f46e5" }}>
              6 articles <span>→</span>
            </div>
          </div>
        </div>

        {/* 3 Quick Action Banners Below Topics */}
        <div className={styles.quickBannersGrid}>
          <div className={styles.quickBannerItem}>
            <div className={styles.quickBannerIcon} style={{ background: "rgba(34, 197, 94, 0.12)", color: "#16a34a" }}>
              <RotateCcw size={16} />
            </div>
            <div>
              <div className={styles.quickBannerTitle}>Request Refund</div>
              <div className={styles.quickBannerSub}>For cancelled or unsatisfactory sessions</div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--dove-gray)", marginLeft: "auto" }} />
          </div>

          <div className={styles.quickBannerItem}>
            <div className={styles.quickBannerIcon} style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}>
              <ShieldAlert size={16} />
            </div>
            <div>
              <div className={styles.quickBannerTitle}>Report an Issue</div>
              <div className={styles.quickBannerSub}>Flag bugs, expert behaviour, or safety concerns</div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--dove-gray)", marginLeft: "auto" }} />
          </div>

          <div className={styles.quickBannerItem}>
            <div className={styles.quickBannerIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#9333ea" }}>
              <Zap size={16} />
            </div>
            <div>
              <div className={styles.quickBannerTitle}>Satisfaction Assurance</div>
              <div className={styles.quickBannerSub}>Claim credits for low-quality consultations</div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--dove-gray)", marginLeft: "auto" }} />
          </div>
        </div>
      </div>

      {/* 5. Lower Section: FAQs & Contact Sidebar */}
      <div className={styles.helpLowerGrid}>
        {/* FAQs Accordion */}
        <div className={styles.faqCard}>
          <div className={styles.faqHeaderRow}>
            <div>
              <h3 className={styles.subTitle}>Frequently Asked Questions</h3>
              <p className={styles.subSubtitle}>Quick answers to the most common questions</p>
            </div>
            <button type="button" className={styles.btnBrowseAllFaq}>
              Browse All
            </button>
          </div>

          <div className={styles.faqTabs}>
            {[
              { id: "all", label: "All" },
              { id: "booking", label: "Booking" },
              { id: "payments", label: "Payments" },
              { id: "experts", label: "Experts" },
              { id: "account", label: "Account" },
              { id: "refunds", label: "Refunds" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.faqTab} ${faqFilter === tab.id ? styles.faqTabActive : ""}`}
                onClick={() => setFaqFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.faqAccordionList}>
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div key={faq.id} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestionRow}
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                  >
                    <span className={styles.faqQuestionText}>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={styles.faqChevron}
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  {isExpanded && <div className={styles.faqAnswerText}>{faq.answer}</div>}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button type="button" className={styles.btnViewMoreFaqs}>
              View 24 More FAQs ▾
            </button>
          </div>
        </div>

        {/* Contact Us & Ticket Status Right Column */}
        <div className={styles.contactSidebarColumn}>
          {/* Contact Us Card */}
          <div className={styles.contactUsCard}>
            <div className={styles.contactHeader}>
              <Headphones size={18} style={{ color: "var(--tango)" }} />
              <div>
                <h3 className={styles.subTitle}>Contact Us</h3>
                <p className={styles.subSubtitle}>We&apos;re here to help you</p>
              </div>
            </div>

            <div className={styles.contactOptionList}>
              {/* WhatsApp Option */}
              <div className={`${styles.contactOptionItem} ${styles.contactWhatsapp}`}>
                <div className={styles.contactOptionLeft}>
                  <div className={styles.optionIconBox} style={{ background: "color-mix(in srgb, var(--tango) 15%, var(--white))", color: "var(--tango)" }}>
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <div className={styles.optionTitle}>Chat on WhatsApp</div>
                    <div className={styles.optionSub}>Fastest · Avg reply in 5 mins</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--tango)" }} />
              </div>

              {/* Support Ticket Option */}
              <div className={styles.contactOptionItem}>
                <div className={styles.contactOptionLeft}>
                  <div className={styles.optionIconBox} style={{ background: "color-mix(in srgb, var(--tango) 12%, var(--white))", color: "var(--tango)" }}>
                    <LifeBuoy size={16} />
                  </div>
                  <div>
                    <div className={styles.optionTitle}>Create Support Ticket</div>
                    <div className={styles.optionSub}>Response within 2–4 hours (Pro)</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--dove-gray)" }} />
              </div>

              {/* Email Support Option */}
              <div className={styles.contactOptionItem}>
                <div className={styles.contactOptionLeft}>
                  <div className={styles.optionIconBox} style={{ background: "color-mix(in srgb, var(--tango) 12%, var(--white))", color: "var(--tango)" }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <div className={styles.optionTitle}>Email Support</div>
                    <div className={styles.optionSub}>support@jatayu.in · 24hr SLA</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--dove-gray)" }} />
              </div>

              {/* Report Abuse Option */}
              <div className={`${styles.contactOptionItem} ${styles.contactReport}`}>
                <div className={styles.contactOptionLeft}>
                  <div className={styles.optionIconBox} style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}>
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <div className={styles.optionTitle} style={{ color: "#dc2626" }}>
                      Report Abuse / Safety
                    </div>
                    <div className={styles.optionSub} style={{ color: "#b91c1c" }}>
                      Urgent review in under 2 hours
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "#dc2626" }} />
              </div>
            </div>

            <div className={styles.supportStatusFooter}>
              <span>● Support is <strong>online</strong> · Mon–Sat, 9 AM – 9 PM IST</span>
            </div>
          </div>

          {/* Ticket Status Timeline Card */}
          <div className={styles.ticketStatusCard}>
            <div className={styles.ticketStatusHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <RefreshCw size={16} style={{ color: "var(--tango)" }} />
                <div>
                  <h4 className={styles.ticketCardTitle}>Ticket Status</h4>
                  <div className={styles.ticketCardSub}>Case #JT-2024-08741</div>
                </div>
              </div>
            </div>

            <div className={styles.timelineList}>
              <div className={styles.timelineStep}>
                <div className={`${styles.timelineDot} ${styles.dotDone}`}>✓</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitle}>Case Created</div>
                  <div className={styles.timelineTime}>Jun 12, 2025 · 2:14 PM</div>
                </div>
              </div>

              <div className={styles.timelineStep}>
                <div className={`${styles.timelineDot} ${styles.dotDone}`}>✓</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitle}>Agent Assigned</div>
                  <div className={styles.timelineTime}>Jun 12, 2025 · 3:30 PM · Raj K.</div>
                </div>
              </div>

              <div className={styles.timelineStep}>
                <div className={`${styles.timelineDot} ${styles.dotActive}`}>⦿</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitle} style={{ color: "var(--tango)", fontWeight: 700 }}>
                    Under Review
                  </div>
                  <div className={styles.timelineTime}>Payment verification in progress</div>
                </div>
              </div>

              <div className={styles.timelineStep}>
                <div className={`${styles.timelineDot} ${styles.dotPending}`}>○</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitle} style={{ color: "var(--dove-gray)" }}>
                    Resolution
                  </div>
                  <div className={styles.timelineTime}>Expected within 24 hours</div>
                </div>
              </div>

              <div className={styles.timelineStep}>
                <div className={`${styles.timelineDot} ${styles.dotPending}`}>○</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitle} style={{ color: "var(--dove-gray)" }}>
                    Case Closed
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.ticketCardActions}>
              <button type="button" className={styles.btnTicketReply}>
                <MessageSquare size={13} /> Add Reply
              </button>
              <button type="button" className={styles.btnTicketFull}>
                Full View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
