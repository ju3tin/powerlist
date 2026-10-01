import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import ProfilesPage from "@/app/components/admin/Profiles";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/login2");
  }

  return <ProfilesPage />;
}