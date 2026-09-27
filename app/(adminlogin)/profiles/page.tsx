"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SocialIcon {
  icon_type: string;
  social_network_url: string;
}

interface Profile {
  _id: string;
  id: number;
  title: string;
  artist_title?: string;
  date?: string;
  content?: string;
  slug: string;
  featured_image?: string;
  power_list_category?: string;
  link?: string;
  social_icons?: SocialIcon[];
  count?: string;
  company_logo?: string;
  full_slug?: string;
  [key: string]: any;
}

const IMPORTANT_FIELDS = [
  "artist_title",
  "featured_image",
  "company_logo",
  "power_list_category",
  "content",
  "social_icons",
];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [filterMissing, setFilterMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/allprofiles");
      if (!res.ok) throw new Error(`Failed to load profiles (${res.status})`);

      const data = await res.json();

      // Always force an array – this prevents the .map crash
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.profiles)
          ? data.profiles
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setProfiles(list);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load profiles");
      setProfiles([]); // keep it an array
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEditor = (p: Profile) => {
    setSelected(p);
    setForm({ ...p });
  };

  const save = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: selected._id, ...form }),
      });
      if (!res.ok) throw new Error("Save failed");
      await load();
      setSelected(null);
    } catch {
      alert("Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  const hasMissing = (p: Profile) =>
    IMPORTANT_FIELDS.some((f) => {
      const val = p[f];
      return (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
      );
    });

  // Always an array
  const displayed = filterMissing
    ? profiles.filter(hasMissing)
    : profiles;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/profiles" className="font-semibold text-lg">
            Profile Manager
          </Link>
          <Link href="/profiles" className="text-sm text-blue-600 font-medium">
            Profiles
          </Link>
          <Link
            href="/upload"
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Upload JSON
          </Link>
        </div>
        <button
          onClick={() => {
            document.cookie = "admin_token=; path=/; max-age=0";
            window.location.href = "/login";
          }}
          className="text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile Editor</h1>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filterMissing}
              onChange={(e) => setFilterMissing(e.target.checked)}
              className="rounded"
            />
            Show only profiles with missing fields
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* List */}
          <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-4 py-3 font-medium border-b">
              {fetching ? "Loading…" : `${displayed.length} profiles`}
            </div>

            <ul className="divide-y max-h-[75vh] overflow-y-auto">
              {fetching ? (
                <li className="px-4 py-8 text-center text-gray-500">
                  Loading profiles…
                </li>
              ) : displayed.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500">
                  No profiles found
                </li>
              ) : (
                displayed.map((p) => (
                  <li
                    key={p._id}
                    onClick={() => openEditor(p)}
                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center
                      ${hasMissing(p) ? "bg-amber-50" : ""}`}
                  >
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-gray-500">
                        {p.artist_title || "— no title"}
                      </div>
                    </div>
                    {hasMissing(p) && (
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                        missing data
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Editor */}
          {selected && (
            <div className="border rounded-xl p-6 space-y-4 bg-white shadow-sm sticky top-6 self-start">
              <h2 className="text-lg font-semibold">
                Editing: {selected.title}
              </h2>

              {[
                "title",
                "artist_title",
                "date",
                "slug",
                "featured_image",
                "power_list_category",
                "link",
                "count",
                "company_logo",
                "full_slug",
              ].map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {key.replace(/_/g, " ")}
                    {IMPORTANT_FIELDS.includes(key) && !form[key] && (
                      <span className="ml-2 text-xs text-red-500">missing</span>
                    )}
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={(form[key] as string) ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1">
                  content (HTML)
                </label>
                <textarea
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.content ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  social_icons (JSON)
                </label>
                <textarea
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={JSON.stringify(form.social_icons ?? [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setForm((prev) => ({ ...prev, social_icons: parsed }));
                    } catch {
                      // ignore while typing
                    }
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={save}
                  disabled={loading}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="border px-5 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}