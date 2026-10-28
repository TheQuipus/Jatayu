import SeekerShell from "@/components/seeker/SeekerShell";
import SeekerAuthGuard from "@/components/seeker/SeekerAuthGuard";

export default function SeekerAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SeekerAuthGuard>
      <SeekerShell>{children}</SeekerShell>
    </SeekerAuthGuard>
  );
}
