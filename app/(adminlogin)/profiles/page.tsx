"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/components/nav";

interface SocialIcon {
  icon_type: string;
  social_network_url: string;
}

interface Profile {
  _id: string;
  id: number;
  title: string;
  email?: string;
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
  "email",
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
  const [filterMissing, setFilterMissing] = useState(false);

  // Search
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);

  const load = async (searchTerm = "") => {
    try {
      setSearching(true);

      const url = searchTerm.trim()
        ? `/api/profiles2?search=${encodeURIComponent(
            searchTerm.trim()
          )}`
        : "/api/profiles2";

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to load profiles");
      }

      const data = await res.json();

      setProfiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load profiles:", error);
      setProfiles([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    setSearch(searchInput);
    load(searchInput);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    load();
  };

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: selected._id,
          ...form,
        }),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      await load(search);

      setSelected(null);
    } catch (e) {
      console.error(e);
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

  const displayed = filterMissing
    ? profiles.filter(hasMissing)
    : profiles;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <AdminNav />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Profile Editor
          </h1>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filterMissing}
              onChange={(e) =>
                setFilterMissing(e.target.checked)
              }
              className="rounded"
            />

            Show only profiles with missing fields
          </label>
        </div>

        {/* Search */}
        <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(e.target.value)
                }
                placeholder="Search profiles by name, email, job title, slug, category..."
                className="w-full border rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="border px-5 py-3 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </form>

          {search && (
            <div className="mt-3 text-sm text-gray-500">
              Search results for{" "}
              <span className="font-medium text-gray-800">
                "{search}"
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile List */}
          <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-4 py-3 font-medium border-b flex justify-between">
              <span>
                {displayed.length}{" "}
                {displayed.length === 1
                  ? "profile"
                  : "profiles"}
              </span>

              {searching && (
                <span className="text-sm text-gray-500">
                  Searching...
                </span>
              )}
            </div>

            <ul className="divide-y max-h-[75vh] overflow-y-auto">
              {displayed.length === 0 ? (
                <li className="px-4 py-10 text-center text-gray-500">
                  {search
                    ? `No profiles found for "${search}"`
                    : "No profiles found"}
                </li>
              ) : (
                displayed.map((p) => (
                  <li
                    key={p._id}
                    onClick={() => openEditor(p)}
                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center ${
                      hasMissing(p)
                        ? "bg-amber-50"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium">
                        {p.title}
                      </div>

                      <div className="text-sm text-gray-500">
                        {p.email || "— no email"}
                      </div>

                      <div className="text-sm text-gray-500">
                        {p.artist_title || "— no title"}
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {p.slug}
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

              {/* Basic fields */}
              {[
                "title",
                "email",
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

                    {IMPORTANT_FIELDS.includes(key) &&
                      !form[key] && (
                        <span className="ml-2 text-xs text-red-500">
                          missing
                        </span>
                      )}
                  </label>

                  <input
                    type={key === "email" ? "email" : "text"}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={(form[key] as string) ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  content (HTML)
                </label>

                <textarea
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.content ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Social Icons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Social icons
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        social_icons: [
                          ...(prev.social_icons ?? []),
                          {
                            icon_type: "",
                            social_network_url: "",
                          },
                        ],
                      }));
                    }}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    + Add social link
                  </button>
                </div>

                <div className="space-y-3">
                  {(form.social_icons ?? []).length === 0 ? (
                    <div className="border rounded-lg p-4 text-sm text-gray-500 bg-gray-50">
                      No social links added.
                    </div>
                  ) : (
                    (form.social_icons ?? []).map(
                      (social, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 bg-gray-50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Icon type */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Icon type
                              </label>

                              <input
                                type="text"
                                value={
                                  social.icon_type ?? ""
                                }
                                onChange={(e) => {
                                  setForm((prev) => {
                                    const socialIcons = [
                                      ...(prev.social_icons ??
                                        []),
                                    ];

                                    socialIcons[index] = {
                                      ...socialIcons[index],
                                      icon_type:
                                        e.target.value,
                                    };

                                    return {
                                      ...prev,
                                      social_icons:
                                        socialIcons,
                                    };
                                  });
                                }}
                                placeholder="linkedin"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* URL */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Social network URL
                              </label>

                              <input
                                type="url"
                                value={
                                  social.social_network_url ??
                                  ""
                                }
                                onChange={(e) => {
                                  setForm((prev) => {
                                    const socialIcons = [
                                      ...(prev.social_icons ??
                                        []),
                                    ];

                                    socialIcons[index] = {
                                      ...socialIcons[index],
                                      social_network_url:
                                        e.target.value,
                                    };

                                    return {
                                      ...prev,
                                      social_icons:
                                        socialIcons,
                                    };
                                  });
                                }}
                                placeholder="https://linkedin.com/in/..."
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                social_icons: (
                                  prev.social_icons ?? []
                                ).filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }}
                            className="mt-3 text-sm text-red-600 hover:text-red-800 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={save}
                  disabled={loading}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? "Saving…"
                    : "Save changes"}
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
