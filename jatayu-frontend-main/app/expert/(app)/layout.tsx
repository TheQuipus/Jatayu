import ExpertShell from "@/components/expert/ExpertShell";
import ExpertAuthGuard from "@/components/expert/ExpertAuthGuard";

export default function ExpertAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ExpertAuthGuard>
      <ExpertShell>{children}</ExpertShell>
    </ExpertAuthGuard>
  );
}
