import UserProfileDetail from "@/components/admin/users/UserProfileDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminSeekerSingularDetailPage({ params }: Props) {
  const { id } = await params;
  return <UserProfileDetail userId={id} userType="seeker" />;
}
