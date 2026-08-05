import type { Metadata } from "next";
import AdminSettings from "@/components/admin/settings/AdminSettings";
import {
  SETTINGS_SECTIONS,
  parseSettingsSection,
  type SettingsSection,
} from "@/lib/adminSettings";

type PageProps = {
  params: Promise<{ section: string }>;
};

export function generateStaticParams() {
  return SETTINGS_SECTIONS.map((section) => ({ section: section.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: sectionParam } = await params;
  const section = parseSettingsSection(sectionParam);
  const label = SETTINGS_SECTIONS.find((item) => item.id === section)?.label ?? "Settings";

  return {
    title: `${label} Settings — Jatayu Admin`,
    description: "Configure SMS, email, SMTP, and message templates for the Jatayu platform.",
  };
}

export default async function AdminSettingsSectionPage({ params }: PageProps) {
  const { section: sectionParam } = await params;
  const section: SettingsSection = parseSettingsSection(sectionParam);

  return <AdminSettings section={section} />;
}
