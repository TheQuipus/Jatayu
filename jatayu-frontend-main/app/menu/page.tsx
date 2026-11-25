import MenuCategoryPanel from "@/components/ui/MenuCategoryPanel";
import TopNavbar from "@/components/ui/TopNavbar";

export const metadata = {
  title: "Menu & Expert Conference | Jatayu",
  description: "Explore Jatayu expert categories and conference profiles",
};

export default function MenuPreviewPage() {
  return (
    <div className="relative min-h-screen bg-[#0C0D12] text-white overflow-x-hidden">
      {/* Top Navbar with drawer capability */}
      <TopNavbar />

      {/* Full-width Category & Expert Conference View for direct desktop & mobile inspection */}
      <div className="w-full pt-16">
        <MenuCategoryPanel />
      </div>
    </div>
  );
}

