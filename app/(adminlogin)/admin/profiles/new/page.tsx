import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import ProfileForm from "@/components/profiles/ProfileForm";
import Link from "next/link";
import AdminNav from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function NewProfilePage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/login2");
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-7xl mx-auto p-6">
        <ProfileForm />
      </main>
    </div>
  );  
}