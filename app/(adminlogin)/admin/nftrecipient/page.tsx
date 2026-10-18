
"use client";
import AdminNav from "@/components/nav";
import RecipientSelection from "@/components/RecipientSelection";
import MintNFTButton from "@/components/admin/MintNFTButton";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  Check,
  CheckSquare,
  Square,
  Eye,
  Pencil,
  X,
  Save,
  Plus,
  Trash2,
  Wallet,
  Link,
  Filter,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserRound,
  ExternalLink,
} from "lucide-react";

type SocialIcon = {
  icon_type: string;
  social_network_url: string;
};

type OtherItem = {
  other_type: string;
  other_type_value: string;
};

type Profile = {
  _id: string;
  id?: number;
  title?: string;
  email?: string;
  artist_title?: string;
  date?: string;
  content?: string;
  slug?: string;
  featured_image?: string;
  power_list_category?: string;
  link?: string;
  social_icons?: SocialIcon[];
  other?: OtherItem[];
  count?: string;
  company_logo?: string;
  full_slug?: string;
  [key: string]: unknown;
};

type EditableProfile = {
  id: number | string;
  title: string;
  email: string;
  artist_title: string;
  date: string;
  content: string;
  slug: string;
  featured_image: string;
  power_list_category: string;
  link: string;
  social_icons: SocialIcon[];
  other: OtherItem[];
  count: string;
  company_logo: string;
  full_slug: string;
};

const PROFILE_FIELDS: {
  key: keyof EditableProfile;
  label: string;
}[] = [
  { key: "title", label: "Name / Title" },
  { key: "email", label: "Email" },
  { key: "artist_title", label: "Job Title" },
  { key: "date", label: "Date" },
  { key: "content", label: "Content" },
  { key: "slug", label: "Slug" },
  { key: "featured_image", label: "Featured Image" },
  { key: "power_list_category", label: "Powerlist Category" },
  { key: "link", label: "Profile Link" },
  { key: "count", label: "Count" },
  { key: "company_logo", label: "Company Logo" },
  { key: "full_slug", label: "Full Slug" },
];

const emptyProfile: EditableProfile = {
  id: "",
  title: "",
  email: "",
  artist_title: "",
  date: "",
  content: "",
  slug: "",
  featured_image: "",
  power_list_category: "",
  link: "",
  social_icons: [],
  other: [],
  count: "",
  company_logo: "",
  full_slug: "",
};

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

function toEditableProfile(profile: Profile): EditableProfile {
  const result: EditableProfile = {
    ...emptyProfile,
    id: profile.id ?? "",
    title: profile.title ?? "",
    email: profile.email ?? "",
    artist_title: profile.artist_title ?? "",
    date: profile.date ?? "",
    content: profile.content ?? "",
    slug: profile.slug ?? "",
    featured_image: profile.featured_image ?? "",
    power_list_category: profile.power_list_category ?? "",
    link: profile.link ?? "",
    social_icons: Array.isArray(profile.social_icons)
      ? profile.social_icons.map((item) => ({
          icon_type: String(item.icon_type ?? ""),
          social_network_url: String(item.social_network_url ?? ""),
        }))
      : [],
    other: Array.isArray(profile.other)
      ? profile.other.map((item) => ({
          other_type: String(item.other_type ?? ""),
          other_type_value: String(item.other_type_value ?? ""),
        }))
      : [],
    count: profile.count ?? "",
    company_logo: profile.company_logo ?? "",
    full_slug: profile.full_slug ?? "",
  };

  return result;
}

function getGender(profile: Profile): string {
  const gender = profile.other?.find((item) =>
    ["gender", "sex"].includes(
      String(item.other_type ?? "").trim().toLowerCase()
    )
  );

  return String(gender?.other_type_value ?? "").trim();
}

function getLinkedIn(profile: Profile): string {
  const social = profile.social_icons?.find((item) => {
    const type = String(item.icon_type ?? "").toLowerCase();
    const url = String(item.social_network_url ?? "").toLowerCase();

    return type.includes("linkedin") || url.includes("linkedin.com/");
  });

  return social?.social_network_url ?? "";
}

function getWallets(profile: Profile): OtherItem[] {
  return (profile.other ?? []).filter((item) => {
    const label = String(item.other_type ?? "").toLowerCase();

    return (
      label.includes("wallet") ||
      label.includes("ethereum") ||
      label.includes("evm") ||
      label.includes("avax") ||
      label.includes("avalanche")
    );
  });
}

function getSearchText(profile: Profile): string {
  return [
    ...Object.entries(profile).flatMap(([key, value]) => {
      if (key === "_id") return [];

      if (Array.isArray(value)) {
        return value.flatMap((item) =>
          typeof item === "object" && item !== null
            ? Object.values(item as Record<string, unknown>).map(String)
            : [String(item ?? "")]
        );
      }

      if (value && typeof value === "object") {
        return Object.values(value as Record<string, unknown>).map(String);
      }

      return [String(value ?? "")];
    }),
  ]
    .join(" ")
    .toLowerCase();
}

function FieldStatus({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const populated = hasValue(value);

  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`inline-flex max-w-[65%] items-center gap-1 text-right text-sm ${
          populated ? "text-gray-900" : "text-amber-700"
        }`}
      >
        {populated ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        )}
        <span className="break-words">
          {populated
            ? String(value).length > 100
              ? `${String(value).slice(0, 100)}…`
              : String(value)
            : "Missing"}
        </span>
      </span>
    </div>
  );
}

function ProfileDetails({ profile }: { profile: Profile }) {
  const gender = getGender(profile);
  const wallets = getWallets(profile);
  const linkedin = getLinkedIn(profile);

  return (
    <div className="space-y-5">
      <section>
        <h4 className="mb-2 font-semibold text-gray-900">Standard fields</h4>
        <div className="rounded-lg border border-gray-200 px-3">
          {PROFILE_FIELDS.map(({ key, label }) => (
            <FieldStatus
              key={key}
              label={label}
              value={profile[key as keyof Profile]}
            />
          ))}
          <FieldStatus label="Gender (from Other)" value={gender} />
          <FieldStatus label="LinkedIn" value={linkedin} />
          <FieldStatus
            label="Wallet address (from Other)"
            value={wallets.map((wallet) => wallet.other_type_value).join(", ")}
          />
        </div>
      </section>

      <section>
        <h4 className="mb-2 font-semibold text-gray-900">
          Social links ({profile.social_icons?.length ?? 0})
        </h4>

        {!profile.social_icons?.length ? (
          <p className="text-sm text-gray-500">No social links.</p>
        ) : (
          <div className="space-y-2">
            {profile.social_icons.map((social, index) => (
              <div
                key={`${social.icon_type}-${index}`}
                className="rounded-lg border border-gray-200 p-3"
              >
                <p className="text-sm font-medium">
                  {social.icon_type || "Unnamed social"}
                </p>
                {social.social_network_url ? (
                  <a
                    href={social.social_network_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm text-blue-600 hover:underline"
                  >
                    {social.social_network_url}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm text-amber-700">Missing URL</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h4 className="mb-2 font-semibold text-gray-900">
          Other fields ({profile.other?.length ?? 0})
        </h4>

        {!profile.other?.length ? (
          <p className="text-sm text-gray-500">No additional fields.</p>
        ) : (
          <div className="space-y-2">
            {profile.other.map((item, index) => (
              <div
                key={`${item.other_type}-${index}`}
                className="rounded-lg border border-gray-200 p-3"
              >
                <p className="text-sm font-medium">
                  {item.other_type || "Unnamed field"}
                </p>
                <p className="mt-1 break-words text-sm text-gray-600">
                  {item.other_type_value || "Empty value"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function NFTRecipientsPage() {
  const [savingSelectionIds, setSavingSelectionIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [linkedinFilter, setLinkedinFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [otherFilter, setOtherFilter] = useState("all");
  const [missingTitleFilter, setMissingTitleFilter] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditableProfile>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/allprofiles", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load profiles (${response.status})`);
      }

      const data = await response.json();

      const list: Profile[] = Array.isArray(data)
        ? data
        : Array.isArray(data.profiles)
          ? data.profiles
          : Array.isArray(data.data)
            ? data.data
            : [];

      setProfiles(
        list.map((profile) => ({
          ...profile,
          _id: String(profile._id ?? profile.id ?? ""),
          social_icons: Array.isArray(profile.social_icons)
            ? profile.social_icons
            : [],
          other: Array.isArray(profile.other) ? profile.other : [],
        }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load profiles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);
  useEffect(() => {
    const loadSavedSelections = async () => {
      try {
        const response = await fetch(
          "/api/nft-selections?year=2026&recipientSelected=true",
          { cache: "no-store" }
        );
  
        const data = await response.json();
  
        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Failed to load saved recipient selections."
          );
        }
  
        const savedIds = (data.selections || []).map(
          (selection: { profileId: string }) => selection.profileId
        );
  
        setSelectedIds(savedIds);
      } catch (error) {
        console.error("Failed to load saved selections:", error);
      }
    };
  
    loadSavedSelections();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          profiles
            .map((profile) => String(profile.power_list_category ?? "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [profiles]
  );

  const genders = useMemo(
    () =>
      Array.from(
        new Set(
          profiles.map(getGender).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      if (query && !getSearchText(profile).includes(query)) return false;

      if (
        categoryFilter &&
        profile.power_list_category !== categoryFilter
      ) {
        return false;
      }

      if (
        genderFilter &&
        getGender(profile).toLowerCase() !== genderFilter.toLowerCase()
      ) {
        return false;
      }

      if (linkedinFilter === "yes" && !getLinkedIn(profile)) return false;
      if (linkedinFilter === "no" && getLinkedIn(profile)) return false;

      const hasWallet = getWallets(profile).some((item) =>
        hasValue(item.other_type_value)
      );

      if (walletFilter === "yes" && !hasWallet) return false;
      if (walletFilter === "no" && hasWallet) return false;

      const hasOther = (profile.other?.length ?? 0) > 0;

      if (otherFilter === "yes" && !hasOther) return false;
      if (otherFilter === "no" && hasOther) return false;

      if (missingTitleFilter && hasValue(profile.title)) return false;

      return true;
    });
  }, [
    profiles,
    search,
    categoryFilter,
    genderFilter,
    linkedinFilter,
    walletFilter,
    otherFilter,
    missingTitleFilter,
  ]);

  const selectedProfiles = useMemo(
    () => profiles.filter((profile) => selectedIds.includes(profile._id)),
    [profiles, selectedIds]
  );

  const setField = <K extends keyof EditableProfile>(
    key: K,
    value: EditableProfile[K]
  ) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  
const toggleSelected = async (profile: Profile) => {
  const id = profile._id;
  const isCurrentlySelected = selectedIds.includes(id);
  const recipientSelected = !isCurrentlySelected;

  setError("");
  setNotice("");

  // Prevent repeated clicks while saving.
  if (savingSelectionIds.includes(id)) return;

  setSavingSelectionIds((current) => [...current, id]);

  try {
    const response = await fetch("/api/nft-selections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profileId: id,
        name: profile.title || "Untitled profile",
        jobTitle: profile.artist_title || "",
        category: profile.power_list_category || "",
        imageUrl: profile.featured_image || "",
        companyLogo: profile.company_logo || "",
        linkedinUrl: getLinkedIn(profile),
        wallet: getWallets(profile)[0]?.other_type_value || "",
        year: 2026,
        recipientSelected,
        status: recipientSelected ? "selected" : "removed",
        mintStatus: "not_minted",
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || data.message || "Failed to save recipient selection."
      );
    }

    // Update the checkbox only after the API confirms success.
    setSelectedIds((current) =>
      recipientSelected
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((selectedId) => selectedId !== id)
    );

    setNotice(
      recipientSelected
        ? `${profile.title || "Recipient"} saved as a selected recipient.`
        : `${profile.title || "Recipient"} removed from selected recipients.`
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to save recipient selection."
    );
  } finally {
    setSavingSelectionIds((current) =>
      current.filter((selectionId) => selectionId !== id)
    );
  }
};



const selectAllFiltered = async () => {
  if (filteredProfiles.length === 0) return;

  const ids = filteredProfiles.map((p) => p._id);
  const allSelected = ids.every((id) => selectedIds.includes(id));
  const recipientSelected = !allSelected;

  setError("");
  setNotice("");
  setSavingSelectionIds((current) => Array.from(new Set([...current, ...ids])));

  try {
    const response = await fetch("/api/nft-selections/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profiles: filteredProfiles.map((profile) => ({
          profileId: profile._id,
          name: profile.title || "Untitled profile",
          jobTitle: profile.artist_title || "",
          category: profile.power_list_category || "",
          imageUrl: profile.featured_image || "",
          companyLogo: profile.company_logo || "",
          linkedinUrl: getLinkedIn(profile),
          wallet: getWallets(profile)[0]?.other_type_value || "",
          year: 2026,
          mintStatus: "not_minted",
        })),
        recipientSelected,
        status: recipientSelected ? "selected" : "removed",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Bulk update failed");
    }

    // Update UI
    setSelectedIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => {
        if (recipientSelected) next.add(id);
        else next.delete(id);
      });
      return Array.from(next);
    });

    setNotice(
      recipientSelected
        ? `${ids.length} profiles selected`
        : `${ids.length} profiles removed`
    );
  } catch (error: any) {
    setError(error.message || "Failed to update selections");
  } finally {
    setSavingSelectionIds((current) =>
      current.filter((id) => !ids.includes(id))
    );
  }
};


  const startEditing = (profile: Profile) => {
    setInspectingId(null);
    setEditingId(profile._id);
    setEditForm(toEditableProfile(profile));
    setError("");
    setNotice("");
  };

  const saveProfileEdits = async () => {
    if (!editingId) return;

    if (!editForm.title.trim()) {
      setError("Name / Title is required.");
      return;
    }

    if (!editForm.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: editingId,
          ...editForm,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to save profile.");
      }

      setEditingId(null);
      setNotice("Profile updated successfully.");
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (
    index: number,
    field: keyof SocialIcon,
    value: string
  ) => {
    setEditForm((current) => ({
      ...current,
      social_icons: current.social_icons.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateOther = (
    index: number,
    field: keyof OtherItem,
    value: string
  ) => {
    setEditForm((current) => ({
      ...current,
      other: current.other.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setGenderFilter("");
    setLinkedinFilter("all");
    setWalletFilter("all");
    setOtherFilter("all");
    setMissingTitleFilter(false);
  };

  const allFilteredSelected =
    filteredProfiles.length > 0 &&
    filteredProfiles.every((profile) => selectedIds.includes(profile._id));

  return (
    <main className="min-h-screen bg-gray-50 pb-36 text-gray-900">
       <AdminNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
              <Wallet className="h-4 w-4" />
              NFT Administration
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              NFT Recipients
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Find Powerlist profiles, check their data, and choose recipients.
              Minting will be added separately.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadProfiles()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh profiles
          </button>
        </header>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <Check className="h-4 w-4" />
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              className="ml-auto"
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search names, emails, LinkedIn, wallets, social links, or any field..."
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-600">
                  Powerlist category
                </span>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-600">
                  Gender (Other field)
                </span>
                <select
                  value={genderFilter}
                  onChange={(event) => setGenderFilter(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5"
                >
                  <option value="">All genders / unspecified</option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                  {!genders.some((gender) => gender.toLowerCase() === "woman") && (
                    <option value="Woman">Woman</option>
                  )}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-600">
                  LinkedIn profile
                </span>
                <select
                  value={linkedinFilter}
                  onChange={(event) => setLinkedinFilter(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5"
                >
                  <option value="all">All profiles</option>
                  <option value="yes">Has LinkedIn</option>
                  <option value="no">Missing LinkedIn</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-600">
                  Wallet in Other
                </span>
                <select
                  value={walletFilter}
                  onChange={(event) => setWalletFilter(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5"
                >
                  <option value="all">All profiles</option>
                  <option value="yes">Has wallet</option>
                  <option value="no">Missing wallet</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-600">
                  Other fields
                </span>
                <select
                  value={otherFilter}
                  onChange={(event) => setOtherFilter(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5"
                >
                  <option value="all">All profiles</option>
                  <option value="yes">Has Other fields</option>
                  <option value="no">No Other fields</option>
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={missingTitleFilter}
                  onChange={(event) => setMissingTitleFilter(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Only profiles missing title
              </label>
            </div>
          )}
        </section>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {filteredProfiles.length} of {profiles.length} profiles
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
              {selectedIds.length} selected
            </span>
          </div>

          <button
            type="button"
            onClick={selectAllFiltered}
            disabled={filteredProfiles.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            {allFilteredSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {allFilteredSelected ? "Deselect filtered" : "Select all filtered"}
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading profiles...
            </div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <UserRound className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 font-semibold">No profiles found</h2>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredProfiles.map((profile) => {
              const selected = selectedIds.includes(profile._id);
              const linkedin = getLinkedIn(profile);
              const wallets = getWallets(profile);
              const populatedFields = PROFILE_FIELDS.filter(({ key }) =>
                hasValue(profile[key as keyof Profile])
              ).length;
              const completeness = Math.round(
                (populatedFields / PROFILE_FIELDS.length) * 100
              );

              return (
                <article
                  key={profile._id}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                    selected
                      ? "border-indigo-400 ring-2 ring-indigo-100"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                  <button
  type="button"
  onClick={() => void toggleSelected(profile)}
  disabled={savingSelectionIds.includes(profile._id)}
  aria-label={selected ? "Deselect recipient" : "Select recipient"}
>
  {selected ? (
    <CheckSquare className="h-5 w-5 text-indigo-600" />
  ) : (
    <Square className="h-5 w-5 text-gray-400" />
  )}
</button>

                    {profile.featured_image ? (
                      <img
                        src={profile.featured_image}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 bg-gray-50 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                        <UserRound className="h-6 w-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="break-words font-semibold">
                        {profile.title || "Untitled profile"}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {profile.artist_title || "No job title"}
                      </p>
                      <p className="mt-1 break-all text-xs text-gray-400">
                        {profile.email || "No email"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {profile.power_list_category && (
                          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs text-purple-700">
                            {profile.power_list_category}
                          </span>
                        )}
                        {getGender(profile) && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                            {getGender(profile)}
                          </span>
                        )}
                       {linkedin && (
  <a
    href={
      linkedin.startsWith("http")
        ? linkedin
        : `https://${linkedin}`
    }
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700 hover:bg-sky-100"
  >
    <Link className="h-3 w-3" />
    LinkedIn
    <ExternalLink className="h-3 w-3" />
  </a>
)}
                        {wallets.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700">
                            <Wallet className="h-3 w-3" />
                            Wallet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Standard field completeness</span>
                      <span>{populatedFields}/{PROFILE_FIELDS.length}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${
                          completeness === 100 ? "bg-green-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {profile.social_icons?.length ?? 0} social links ·{" "}
                      {profile.other?.length ?? 0} other fields
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50 p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectingId((current) =>
                          current === profile._id ? null : profile._id
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                      {inspectingId === profile._id ? "Hide details" : "Inspect all fields"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditing(profile)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit fields
                    </button>

                    {profile.link && (
                      <a
                        href={profile.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Profile link
                      </a>
                    )}
                    <MintNFTButton profile={profile} />
                  </div>

                  {inspectingId === profile._id && (
                    <div className="border-t border-gray-200 p-4 sm:p-5">
                      <ProfileDetails profile={profile} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedProfiles.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="font-semibold">
                {selectedProfiles.length} recipient
                {selectedProfiles.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-sm text-gray-500">
                Selection only — no NFTs have been minted.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Clear selection
              </button>
              <button
                type="button"
                onClick={() => {
                  const names = selectedProfiles
                    .map((profile) => profile.title || "Untitled profile")
                    .join(", ");

                  setNotice(
                    `Currently selected: ${names}. This is a preview only; no minting or recipient record has been saved.`
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Wallet className="h-4 w-4" />
                Review recipients
              </button>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-6">
          <div className="mx-auto my-4 max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-xl font-bold">Edit profile</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update standard fields, social links, and Other fields.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                disabled={saving}
                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close editor"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-7 p-5 sm:p-7">
              <section>
                <h3 className="mb-4 font-semibold">Standard fields</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {PROFILE_FIELDS.map(({ key, label }) => (
                    <label
                      key={key}
                      className={`block text-sm ${
                        key === "content" ? "sm:col-span-2" : ""
                      }`}
                    >
                      <span className="mb-1.5 block font-medium text-gray-600">
                        {label}
                        {(key === "title" || key === "slug") && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </span>

                      {key === "content" ? (
                        <textarea
                          value={String(editForm[key] ?? "")}
                          onChange={(event) =>
                            setField(key, event.target.value)
                          }
                          rows={5}
                          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      ) : (
                        <input
                          value={String(editForm[key] ?? "")}
                          onChange={(event) =>
                            setField(key, event.target.value)
                          }
                          required={key === "title" || key === "slug"}
                          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Social links</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add or edit LinkedIn and other social URLs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((current) => ({
                        ...current,
                        social_icons: [
                          ...current.social_icons,
                          { icon_type: "", social_network_url: "" },
                        ],
                      }))
                    }
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add link
                  </button>
                </div>

                {editForm.social_icons.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                    No social links added.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editForm.social_icons.map((social, index) => (
                      <div
                        key={`social-${index}`}
                        className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_2fr_auto]"
                      >
                        <label className="text-sm">
                          <span className="mb-1 block text-gray-500">
                            Social type
                          </span>
                          <input
                            value={social.icon_type}
                            onChange={(event) =>
                              updateSocial(index, "icon_type", event.target.value)
                            }
                            placeholder="linkedin"
                            className="w-full rounded-lg border border-gray-300 p-2.5"
                          />
                        </label>

                        <label className="text-sm">
                          <span className="mb-1 block text-gray-500">URL</span>
                          <input
                            value={social.social_network_url}
                            onChange={(event) =>
                              updateSocial(
                                index,
                                "social_network_url",
                                event.target.value
                              )
                            }
                            placeholder="https://..."
                            className="w-full rounded-lg border border-gray-300 p-2.5"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((current) => ({
                              ...current,
                              social_icons: current.social_icons.filter(
                                (_, itemIndex) => itemIndex !== index
                              ),
                            }))
                          }
                          className="self-end rounded-lg p-2.5 text-red-600 hover:bg-red-50"
                          aria-label="Remove social link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Other fields</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Gender, wallet addresses, and other custom fields are stored here.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((current) => ({
                        ...current,
                        other: [
                          ...current.other,
                          { other_type: "", other_type_value: "" },
                        ],
                      }))
                    }
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add field
                  </button>
                </div>

                {editForm.other.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                    No Other fields added.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editForm.other.map((item, index) => (
                      <div
                        key={`other-${index}`}
                        className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_2fr_auto]"
                      >
                        <label className="text-sm">
                          <span className="mb-1 block text-gray-500">
                            Field name
                          </span>
                          <input
                            value={item.other_type}
                            onChange={(event) =>
                              updateOther(index, "other_type", event.target.value)
                            }
                            placeholder="Gender, Wallet, etc."
                            className="w-full rounded-lg border border-gray-300 p-2.5"
                          />
                        </label>

                        <label className="text-sm">
                          <span className="mb-1 block text-gray-500">
                            Field value
                          </span>
                          <input
                            value={item.other_type_value}
                            onChange={(event) =>
                              updateOther(
                                index,
                                "other_type_value",
                                event.target.value
                              )
                            }
                            placeholder="Woman, 0x..., etc."
                            className="w-full rounded-lg border border-gray-300 p-2.5"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((current) => ({
                              ...current,
                              other: current.other.filter(
                                (_, itemIndex) => itemIndex !== index
                              ),
                            }))
                          }
                          className="self-end rounded-lg p-2.5 text-red-600 hover:bg-red-50"
                          aria-label="Remove Other field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:px-7">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveProfileEdits()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
