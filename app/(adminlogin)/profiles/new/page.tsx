"use client";
import ProfileForm from "@/components/profiles/ProfileForm";
import Link from "next/link";
import AdminNav from "@/components/nav";

export default function NewProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-7xl mx-auto p-6">
        <ProfileForm />
      </main>
    </div>
  );  
}