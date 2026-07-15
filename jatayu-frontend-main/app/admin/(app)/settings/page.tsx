import { redirect } from "next/navigation";
import { getSettingsSectionHref } from "@/lib/adminSettings";

export default function AdminSettingsPage() {
  redirect(getSettingsSectionHref("sms"));
}
