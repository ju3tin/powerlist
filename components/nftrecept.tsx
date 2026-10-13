"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SocialIcon = {
  icon_type?: string;
  social_network_url?: string;
};

type OtherItem = {
  other_type?: string;
  other_type_value?: string;
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
  gender?: string;
};

const PROFILE_FIELDS: {
  key: keyof Profile;
  label: string;
}[] = [
  { key: "title", label: "Title" },
  { key: "email", label: "Email" },
  { key: "artist_title", label: "Artist title" },
  { key: "date", label: "Date" },
  { key: "content", label: "Content" },
  { key: "slug", label: "Slug" },
  { key: "featured_image", label: "Featured image" },
  { key: "power_list_category", label: "Powerlist category" },
  { key: "link", label: "Link" },
  { key: "count", label: "Count" },
  { key: "company_logo", label: "Company logo" },
  { key: "full_slug", label: "Full slug" },
  { key: "gender", label: "Gender" },
];

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function getGender(profile: Profile): string {
  const otherGender = profile.other?.find((item) =>
    /^(gender|sex)$/i.test(item.other_type?.trim() ?? "")
  )?.other_type_value;

  return (profile.gender ?? otherGender ?? "").trim().toLowerCase();
}

function getLinkedIn(profile: Profile): SocialIcon[] {
  return (profile.social_icons ?? []).filter(
    (item) =>
      /linkedin/i.test(item.icon_type ?? "") &&
      hasValue(item.social_network_url)
  );
}

function getWalletEntries(profile: Profile): OtherItem[] {
  return (profile.other ?? []).filter(
    (item) =>
      /wallet|ethereum|evm|avax|avalanche/i.test(item.other_type ?? "") &&
      hasValue(item.other_type_value)
  );
}

function getAllSearchText(profile: Profile): string {
  return [
    ...PROFILE_FIELDS.map(({ key }) => {
      const value = profile[key];
      return typeof value === "string" ? value : "";
    }),
    ...(profile.social_icons ?? []).flatMap((item) => [
      item.icon_type ?? "",
      item.social_network_url ?? "",
    ]),
    ...(profile.other ?? []).flatMap((item) => [
      item.other_type ?? "",
      item.other_type_value ?? "",
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

function Status({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
        available
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {available ? "Available" : "Missing"}
    </span>
  );
}

function ProfileDetails({ profile }: { profile: Profile }) {
  const wallets = getWalletEntries(profile);
  const linkedin = getLinkedIn(profile);

  return (
    <div className="space-y-5 border-t p-4">
      <section>
        <h3 className="mb-3 font-semibold">Standard profile fields</h3>

        <div className="space-y-2">
          {PROFILE_FIELDS.map(({ key, label }) => {
            const value = profile[key];
            const available = hasValue(value);

            return (
              <div
                key={key}
                className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-2"
              >
                <span className="text-sm font-medium">{label}</span>

                <div className="flex min-w-0 flex-col items-end gap-1">
                  <Status available={available} />
                  {available && (
                    <span className="max-w-64 break-words text-right text-xs text-gray-600">
                      {typeof value === "string" ? value : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">
          Social links ({profile.social_icons?.length ?? 0})
        </h3>

        {profile.social_icons?.length ? (
          <div className="space-y-2">
            {profile.social_icons.map((social, index) => (
              <div
                key={`${social.icon_type}-${index}`}
                className="rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {social.icon_type || "Unnamed social link"}
                  </span>
                  <Status available={hasValue(social.social_network_url)} />
                </div>

                {social.social_network_url ? (
                  <a
                    href={social.social_network_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-sm text-blue-700 underline"
                  >
                    {social.social_network_url}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">URL missing</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No social links recorded.</p>
        )}

        <p className="mt-3 text-sm">
          LinkedIn:{" "}
          <strong>{linkedin.length ? "Available" : "Missing"}</strong>
        </p>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">
          Other fields ({profile.other?.length ?? 0})
        </h3>

        {profile.other?.length ? (
          <div className="space-y-2">
            {profile.other.map((item, index) => (
              <div
                key={`${item.other_type || "other"}-${index}`}
                className="rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {item.other_type || "Unnamed field"}
                  </span>
                  <Status available={hasValue(item.other_type_value)} />
                </div>

                <p className="mt-2 break-words text-sm text-gray-600">
                  {item.other_type_value || "Value missing"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No Other fields recorded.</p>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold">
          NFT wallet ({wallets.length})
        </h3>

        {wallets.length ? (
          wallets.map((wallet, index) => (
            <div
              key={`${wallet.other_type}-${index}`}
              className="mb-2 rounded-lg border p-3"
            >
              <p className="font-medium">{wallet.other_type}</p>
              <p className="mt-1 break-all font-mono text-xs">
                {wallet.other_type_value}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-amber-700">
            No recognised wallet entry found in Other.
          </p>
        )}
      </section>
    </div>
  );
}

export default function NFTRecipientsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");
  const [linkedinOnly, setLinkedinOnly] = useState(false);
  const [walletOnly, setWalletOnly] = useState(false);
  const [otherOnly, setOtherOnly] = useState(false);
  const [missingTitle, setMissingTitle] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/profiles", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Failed to load profiles");
      }

      const list: Profile[] = Array.isArray(result)
        ? result
        : result.profiles ?? result.data ?? [];

      setProfiles(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load profiles"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          profiles
            .map((profile) => profile.power_list_category?.trim())
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [profiles]
  );

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((profile) => {
        if (!getAllSearchText(profile).includes(search.trim().toLowerCase())) {
          return false;
        }

        if (
          category !== "all" &&
          profile.power_list_category !== category
        ) {
          return false;
        }

        if (gender === "woman" && getGender(profile) !== "woman") {
          return false;
        }

        if (gender === "missing" && getGender(profile)) {
          return false;
        }

        if (linkedinOnly && getLinkedIn(profile).length === 0) {
          return false;
        }

        if (walletOnly && getWalletEntries(profile).length === 0) {
          return false;
        }

        if (otherOnly && !(profile.other?.length)) {
          return false;
        }

        if (missingTitle && hasValue(profile.title)) {
          return false;
        }

        return true;
      }),
    [
      profiles,
      search,
      category,
      gender,
      linkedinOnly,
      walletOnly,
      otherOnly,
      missingTitle,
    ]
  );

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
    setNotice("");
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function selectFiltered() {
    setSelectedIds((current) =>
      Array.from(
        new Set([...current, ...filteredProfiles.map((profile) => profile._id)])
      )
    );
    setNotice("");
  }

  function deselectFiltered() {
    const visible = new Set(filteredProfiles.map((profile) => profile._id));
    setSelectedIds((current) => current.filter((id) => !visible.has(id)));
    setNotice("");
  }

  function reviewRecipients() {
    const selected = profiles.filter((profile) =>
      selectedIds.includes(profile._id)
    );

    if (!selected.length) {
      setNotice("Select at least one recipient.");
      return;
    }

    const missingTitles = selected.filter(
      (profile) => !hasValue(profile.title)
    ).length;

    const missingWallets = selected.filter(
      (profile) => getWalletEntries(profile).length === 0
    ).length;

    const missingLinkedIn = selected.filter(
      (profile) => getLinkedIn(profile).length === 0
    ).length;

    setNotice(
      `${selected.length} selected. Missing title: ${missingTitles}. Missing wallet: ${missingWallets}. Missing LinkedIn: ${missingLinkedIn}. Review these details before finalising recipients. Nothing has been saved or minted.`
    );
  }

  const selectedCount = selectedIds.length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 pb-36 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">NFT Recipients</h1>
          <p className="mt-2 text-gray-600">
            Inspect Powerlist profile data and choose NFT recipients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadProfiles()}
          disabled={loading}
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh profiles"}
        </button>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="mb-4 text-lg font-semibold">Filter profiles</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium">
            Search all profile data
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, URL, Other value..."
              className="mt-1 w-full rounded-lg border p-3 font-normal"
            />
          </label>

          <label className="text-sm font-medium">
            Powerlist category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 w-full rounded-lg border p-3 font-normal"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Gender
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className="mt-1 w-full rounded-lg border p-3 font-normal"
            >
              <option value="all">All / not filtered</option>
              <option value="woman">Woman</option>
              <option value="missing">Gender not recorded</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={linkedinOnly}
              onChange={(event) => setLinkedinOnly(event.target.checked)}
            />
            Has LinkedIn
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={walletOnly}
              onChange={(event) => setWalletOnly(event.target.checked)}
            />
            Has wallet in Other
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={otherOnly}
              onChange={(event) => setOtherOnly(event.target.checked)}
            />
            Has Other details
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={missingTitle}
              onChange={(event) => setMissingTitle(event.target.checked)}
            />
            Missing title
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
          <span className="text-sm text-gray-600">
            {filteredProfiles.length} profiles shown / {profiles.length} total
          </span>

          <span className="text-sm font-semibold">
            {selectedCount} selected
          </span>

          <button
            type="button"
            onClick={selectFiltered}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Select filtered
          </button>

          <button
            type="button"
            onClick={deselectFiltered}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Deselect filtered
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-300 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center">Loading profiles...</p>
      ) : (
        <section className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProfiles.map((profile) => {
            const selected = selectedIds.includes(profile._id);
            const expanded = expandedIds.includes(profile._id);
            const wallets = getWalletEntries(profile);
            const linkedin = getLinkedIn(profile);

            return (
              <article
                key={profile._id}
                className={`overflow-hidden rounded-xl border bg-white ${
                  selected ? "border-blue-600 ring-2 ring-blue-600" : ""
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelected(profile._id)}
                      aria-label={`Select ${profile.title || "profile"}`}
                      className="mt-1 h-5 w-5"
                    />

                    {profile.featured_image ? (
                      <img
                        src={profile.featured_image}
                        alt={profile.title || "Profile"}
                        className="h-24 w-24 rounded-lg bg-gray-100 object-contain"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 text-center text-xs text-gray-500">
                        No featured image
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="break-words font-bold">
                        {profile.title || "Title missing"}
                      </h2>

                      <p className="mt-1 text-sm text-gray-600">
                        {profile.artist_title || "Artist title missing"}
                      </p>

                      <p className="mt-2 text-sm">
                        {profile.power_list_category || "Category missing"}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-500">
                        {profile.email || "Email missing"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {linkedin.length ? "LinkedIn available" : "No LinkedIn"}
                    </span>

                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {profile.other?.length ?? 0} Other entries
                    </span>

                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {wallets.length ? "Wallet available" : "No wallet found"}
                    </span>

                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      Gender: {getGender(profile) || "Unknown"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpanded(profile._id)}
                    className="mt-4 w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    {expanded ? "Hide all details" : "Inspect all API fields"}
                  </button>
                </div>

                {expanded && <ProfileDetails profile={profile} />}
              </article>
            );
          })}
        </section>
      )}

      {!loading && filteredProfiles.length === 0 && !error && (
        <p className="rounded-xl border p-8 text-center text-gray-500">
          No profiles match the selected filters.
        </p>
      )}

      <section className="fixed inset-x-0 bottom-0 z-20 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">
              {selectedCount} recipient{selectedCount === 1 ? "" : "s"} selected
            </p>
            <p className="text-sm text-gray-500">
              Selection is currently held in this page only.
            </p>
          </div>

          <button
            type="button"
            onClick={reviewRecipients}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Review recipients
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className="mx-auto mt-3 max-w-7xl rounded-lg border p-3 text-sm"
          >
            {notice}
          </div>
        )}
      </section>
    </main>
  );
}
