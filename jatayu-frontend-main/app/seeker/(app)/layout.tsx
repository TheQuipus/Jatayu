import SeekerShell from "@/components/seeker/SeekerShell";

export default function SeekerAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SeekerShell>{children}</SeekerShell>;
}
