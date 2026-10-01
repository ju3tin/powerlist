
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import LogoutButton from "@/app/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getAdminSession();

  if (!admin) redirect("/login2");

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2">Welcome, {admin.name}</p>
          <p className="text-sm text-gray-600">{admin.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/admin/profiles"
          className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Manage Profiles</h2>
          <p className="mt-2 text-gray-600">
            View and manage profile records.
          </p>
        </Link>
      </section>
      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/admin/profiles/new"
          className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Add Profile</h2>
          <p className="mt-2 text-gray-600">
            Add new profile.
          </p>
        </Link>
      </section>
      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/admin/editticket"
          className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Edit Tickets</h2>
          <p className="mt-2 text-gray-600">
            View and manage your tickets.
          </p>
        </Link>
      </section>
    </main>
  );
}