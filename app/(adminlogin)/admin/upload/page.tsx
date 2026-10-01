import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import Upload from "@/app/components/admin/Upload";

export const dynamic = "force-dynamic";

export default async function AdminUploadPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/login2");
  }

  return <Upload />;
}