import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminTicketDesigner from "@/app/components/admin/AdminTicketDesigner";

export const dynamic = "force-dynamic";

export default async function AdminTicketPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/login2");
  }

  return <AdminTicketDesigner />;
}