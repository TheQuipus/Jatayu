import ExpertShell from "@/components/expert/ExpertShell";

export default function ExpertAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ExpertShell>{children}</ExpertShell>;
}
