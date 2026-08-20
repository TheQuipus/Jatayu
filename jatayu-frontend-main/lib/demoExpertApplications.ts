import { createDefaultSlot, type TimeSlot } from "./expertAvailability";
import type { ExpertApplicationSubmission } from "./expertApplicationSubmission";

function createDemoDefaultSlot(): TimeSlot {
  return {
    ...createDefaultSlot(),
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  };
}

export const DEMO_APPLICATION_APP_IDS = [
  "APP-1079",
  "APP-1080",
  "APP-1081",
] as const;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const demoEmployment = [
  {
    id: "emp-1",
    jobTitle: "Senior Legal Consultant",
    company: "Independent Practice",
    startMonth: "03",
    startYear: "2018",
    endMonth: "",
    endYear: "",
    currentlyWorking: true,
    responsibilities:
      "Advised startup founders on incorporation, ESOP plans, and commercial contracts.",
  },
];

const demoEducation = [
  {
    id: "edu-1",
    degree: "LLB",
    fieldOfStudy: "Corporate Law",
    institution: "National Law School of India University",
    graduationYear: "2014",
    honours: "First Class",
  },
];

function demoDefaults(
  overrides: Partial<ExpertApplicationSubmission>,
): ExpertApplicationSubmission {
  const submittedAt = overrides.submittedAt ?? hoursAgo(24);
  return {
    employmentPositions: demoEmployment,
    educationDegrees: demoEducation,
    acceptCustomRequests: false,
    termsAcceptedAt: submittedAt,
    portfolioLinks: [],
    portfolioSamples: [],
    ...overrides,
  } as ExpertApplicationSubmission;
}

export function getDemoExpertApplications(): ExpertApplicationSubmission[] {
  return [
    demoDefaults({
      appId: "APP-1079",
      submittedAt: hoursAgo(38),
      status: "in_review",
      name: "Arjun Mehta",
      email: "arjun.mehta@example.com",
      phone: "+91 98765 43210",
      categoryId: "legal",
      categoryLabel: "Legal & Compliance",
      skills: ["Corporate Law", "Startup Legal", "Contract Drafting", "ESOP Structuring"],
      experienceLevel: "leader",
      professionalTitle: "Senior Legal Consultant",
      tagLine: "Practical legal advice for founders, in plain language.",
      bio: "Corporate and commercial law specialist advising startups and SMEs across India. Former in-house counsel at a Series B fintech.",
      avatar: "/assets/img/avatar2.png",
      location: "Bangalore, Karnataka",
      linkedin: "linkedin.com/in/arjun-mehta-legal",
      portfolio: "arjunmehta.legal",
      portfolioLinks: [
        { id: "portfolio-link-linkedin-1", url: "linkedin.com/in/arjun-mehta-legal", platform: "LinkedIn" },
        { id: "portfolio-link-site-1", url: "arjunmehta.legal", platform: "Portfolio" },
      ],
      certificates: [
        { id: "d1", name: "Bar Council Certificate.pdf", size: "2.1 MB", url: "/assets/legal.png" },
        { id: "d2", name: "Government Photo ID.pdf", size: "1.0 MB", url: "/assets/legal.png" },
        { id: "d3", name: "LLB Degree Certificate.pdf", size: "3.2 MB", url: "/assets/legal.png" },
      ],
      formats: ["video", "written"],
      lengths: ["30", "45"],
      formatPrices: { video: "1200", written: "299" },
      languages: ["English", "Hindi", "Kannada"],
      audiences: ["startup", "smb"],
      timezone: "Asia/Kolkata",
      availabilitySlots: [createDemoDefaultSlot()],
      governmentId: {
        type: "aadhaar",
        front: { name: "Aadhaar Front.pdf", size: "1.2 MB", url: "/assets/legal.png" },
        back: { name: "Aadhaar Back.pdf", size: "1.1 MB", url: "/assets/legal.png" },
      },
      kycVideoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      portfolioSamples: [
        {
          id: "sample-1",
          fileName: "CaseStudy_ArjunMehta.pdf",
          fileSize: "1.4 MB",
          fileType: "application/pdf",
          description: "Seed funding legal compliance checklist",
          url: "/assets/legal.png",
          status: "complete",
          progress: 100,
        },
      ],
      acceptCustomRequests: true,
      reviewerNote: "Verified all qualifications. Strong background in corporate law and VC funding advisory.",
    }),
    demoDefaults({
      appId: "APP-1080",
      submittedAt: hoursAgo(14),
      status: "pending",
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+91 91234 56780",
      categoryId: "design",
      categoryLabel: "Product Design",
      skills: ["UI / UX Design", "Design Systems", "User Research", "Prototyping"],
      experienceLevel: "established",
      professionalTitle: "Lead Product Designer",
      tagLine: "Design clarity for early-stage product teams.",
      bio: "Product designer with 6 years across B2B SaaS and consumer apps. I help teams ship usable v1s fast.",
      avatar: "/assets/img/avatar3.png",
      location: "Mumbai, Maharashtra",
      linkedin: "linkedin.com/in/priya-sharma-ux",
      portfolio: "priyasharma.design",
      portfolioLinks: [
        { id: "portfolio-link-linkedin-2", url: "linkedin.com/in/priya-sharma-ux", platform: "LinkedIn" },
        { id: "portfolio-link-site-2", url: "priyasharma.design", platform: "Portfolio" },
      ],
      employmentPositions: [
        {
          id: "emp-1",
          jobTitle: "Lead Product Designer",
          company: "Northstar SaaS",
          startMonth: "01",
          startYear: "2020",
          endMonth: "",
          endYear: "",
          currentlyWorking: true,
          responsibilities: "Led design systems and onboarding flows for a B2B analytics platform.",
        },
      ],
      educationDegrees: [
        {
          id: "edu-1",
          degree: "Bachelor's Degree",
          fieldOfStudy: "Interaction Design",
          institution: "MIT Institute of Design",
          graduationYear: "2018",
          honours: "",
        },
      ],
      certificates: [{ id: "d1", name: "Google UX Certificate.pdf", size: "1.8 MB", url: "/assets/legal.png" }],
      formats: ["written", "audio"],
      lengths: ["30"],
      formatPrices: { written: "399", audio: "699" },
      languages: ["English", "Hindi"],
      audiences: ["startup", "career"],
      timezone: "Asia/Kolkata",
      availabilitySlots: [createDemoDefaultSlot()],
    }),
    demoDefaults({
      appId: "APP-1081",
      submittedAt: hoursAgo(54),
      status: "pending",
      name: "Amit Patel",
      email: "amit.patel@example.com",
      phone: "+91 99887 76655",
      categoryId: "marketing",
      categoryLabel: "Marketing & Growth",
      skills: ["SEO Strategy", "Content Marketing"],
      experienceLevel: "emerging",
      professionalTitle: "Growth Marketer",
      tagLine: "",
      bio: "",
      avatar: "/assets/img/avatar4.png",
      location: "Ahmedabad, Gujarat",
      linkedin: "",
      portfolio: "",
      employmentPositions: [],
      educationDegrees: [],
      certificates: [],
      formats: ["written"],
      lengths: ["15"],
      formatPrices: { written: "199" },
      languages: ["English", "Gujarati"],
      audiences: ["smb"],
      timezone: "Asia/Kolkata",
      availabilitySlots: [],
    }),
  ];
}
