"use client";

import { FormEvent, useState } from "react";

type SocialIcon = {
  icon_type: string;
  social_network_url: string;
};

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string;
  profile?: any;
}

export default function ProfileForm() {
  const [form, setForm] = useState({
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
    count: "",
    company_logo: "",
    full_slug: "",
  });

  const [socialIcons, setSocialIcons] =
    useState<SocialIcon[]>([]);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [apiResponse, setApiResponse] =
    useState<ApiResponse | null>(null);

  const [apiStatus, setApiStatus] =
    useState<number | null>(null);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(value: string) {
    setForm((previous) => ({
      ...previous,
      title: value,
      slug:
        previous.slug ||
        generateSlug(value),
    }));
  }

  // --------------------------------------------------
  // SOCIAL ICONS
  // --------------------------------------------------

  function addSocialIcon() {
    setSocialIcons((previous) => [
      ...previous,
      {
        icon_type: "",
        social_network_url: "",
      },
    ]);
  }

  function updateSocialIcon(
    index: number,
    field: keyof SocialIcon,
    value: string
  ) {
    setSocialIcons((previous) =>
      previous.map((social, i) =>
        i === index
          ? {
              ...social,
              [field]: value,
            }
          : social
      )
    );
  }

  function removeSocialIcon(index: number) {
    setSocialIcons((previous) =>
      previous.filter(
        (_, i) => i !== index
      )
    );
  }

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);

    setMessage("");

    setApiResponse(null);

    setApiStatus(null);

    try {
      const payload = {
        ...form,

        id: Number(form.id),

        email: form.email
          .trim()
          .toLowerCase(),

        social_icons: socialIcons,
      };

      console.log(
        "PROFILE API REQUEST:",
        payload
      );

      const response = await fetch(
        "/api/singleprofile1",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      setApiStatus(response.status);

      const data: ApiResponse =
        await response.json();

      console.log(
        "PROFILE API STATUS:",
        response.status
      );

      console.log(
        "PROFILE API RESPONSE:",
        data
      );

      // Show exact API response
      setApiResponse(data);

      if (!response.ok) {
        setMessage(
          data.error ||
            "Failed to create profile"
        );

        return;
      }

      setMessage(
        data.message ||
          "Profile created successfully."
      );

      // Reset form
      setForm({
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
        count: "",
        company_logo: "",
        full_slug: "",
      });

      setSocialIcons([]);
    } catch (error: any) {
      console.error(
        "Create profile error:",
        error
      );

      const errorResponse = {
        success: false,
        error:
          error?.message ||
          "Something went wrong",
        code: "REQUEST_ERROR",
      };

      setApiResponse(errorResponse);

      setMessage(
        errorResponse.error
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl space-y-8 text-black"
    >
      {/* ------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------ */}

      <div>
        <h1 className="text-3xl font-bold text-black">
          Add Profile
        </h1>

        <p className="mt-2 text-gray-600">
          Create a new unverified profile.
        </p>
      </div>

      {/* ------------------------------------------------ */}
      {/* API RESPONSE */}
      {/* ------------------------------------------------ */}

      {(message || apiResponse) && (
        <div
          className={`rounded-lg border p-4 ${
            apiResponse?.success === true
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <strong
              className={
                apiResponse?.success === true
                  ? "text-green-800"
                  : "text-red-800"
              }
            >
              {apiResponse?.success === true
                ? "Success"
                : "API Response"}
            </strong>

            {apiStatus && (
              <span className="rounded bg-black px-2 py-1 text-xs font-semibold text-white">
                HTTP {apiStatus}
              </span>
            )}
          </div>

          {message && (
            <p className="mt-2 text-black">
              {message}
            </p>
          )}

          {apiResponse?.error && (
            <p className="mt-2 font-medium text-red-700">
              {apiResponse.error}
            </p>
          )}

          {apiResponse?.code && (
            <p className="mt-2 text-sm text-gray-700">
              Code:{" "}
              <strong>
                {apiResponse.code}
              </strong>
            </p>
          )}

          {apiResponse?.profile && (
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-black">
                View created profile
              </summary>

              <pre className="mt-3 overflow-auto rounded-lg bg-black p-4 text-xs text-white">
                {JSON.stringify(
                  apiResponse.profile,
                  null,
                  2
                )}
              </pre>
            </details>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-black">
              View raw API response
            </summary>

            <pre className="mt-3 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-white">
              {JSON.stringify(
                apiResponse,
                null,
                2
              )}
            </pre>
          </details>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* PROFILE INFORMATION */}
      {/* ------------------------------------------------ */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-black">
          Profile Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Profile ID */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Profile ID *
            </label>

            <input
              type="number"
              required
              value={form.id}
              onChange={(e) =>
                updateField(
                  "id",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
            />
          </div>

          {/* Date */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Date
            </label>

            <input
              type="text"
              placeholder="2026"
              value={form.date}
              onChange={(e) =>
                updateField(
                  "date",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
            />
          </div>

          {/* Title */}

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium text-black">
              Title *
            </label>

            <input
              type="text"
              required
              value={form.title}
              onChange={(e) =>
                handleTitleChange(
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="Rachel Logan"
            />
          </div>

          {/* Email */}

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium text-black">
              Email *
            </label>

            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                updateField(
                  "email",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="rachel@example.com"
            />

            <p className="mt-1 text-xs text-gray-500">
              Email addresses can only be used
              once.
            </p>
          </div>

          {/* Artist Title */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Artist Title
            </label>

            <input
              type="text"
              value={form.artist_title}
              onChange={(e) =>
                updateField(
                  "artist_title",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
            />
          </div>

          {/* Power List Category */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Power List Category
            </label>

            <input
              type="text"
              value={
                form.power_list_category
              }
              onChange={(e) =>
                updateField(
                  "power_list_category",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="Women in FinTech"
            />
          </div>

        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* URLS */}
      {/* ------------------------------------------------ */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-black">
          URLs
        </h2>

        <div className="space-y-5">

          {/* Slug */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Slug *
            </label>

            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) =>
                updateField(
                  "slug",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="rachel-logan"
            />
          </div>

          {/* Full Slug */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Full Slug
            </label>

            <input
              type="text"
              value={form.full_slug}
              onChange={(e) =>
                updateField(
                  "full_slug",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="/women-in-fintech/rachel-logan"
            />
          </div>

          {/* Link */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Link
            </label>

            <input
              type="url"
              value={form.link}
              onChange={(e) =>
                updateField(
                  "link",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="https://example.com"
            />
          </div>

        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* IMAGES */}
      {/* ------------------------------------------------ */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-black">
          Images
        </h2>

        <div className="space-y-5">

          {/* Featured Image */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Featured Image
            </label>

            <input
              type="url"
              value={
                form.featured_image
              }
              onChange={(e) =>
                updateField(
                  "featured_image",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="https://..."
            />

            {form.featured_image && (
              <img
                src={
                  form.featured_image
                }
                alt="Preview"
                className="mt-4 h-48 w-full rounded-lg object-cover"
              />
            )}
          </div>

          {/* Company Logo */}

          <div>
            <label className="mb-2 block font-medium text-black">
              Company Logo
            </label>

            <input
              type="url"
              value={
                form.company_logo
              }
              onChange={(e) =>
                updateField(
                  "company_logo",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="https://..."
            />

            {form.company_logo && (
              <img
                src={
                  form.company_logo
                }
                alt="Company logo"
                className="mt-4 h-24 max-w-xs object-contain"
              />
            )}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* CONTENT */}
      {/* ------------------------------------------------ */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-black">
          Content
        </h2>

        <textarea
          value={form.content}
          onChange={(e) =>
            updateField(
              "content",
              e.target.value
            )
          }
          rows={12}
          className="w-full rounded-lg border p-3 text-black"
          placeholder="Profile content..."
        />
      </section>

      {/* ------------------------------------------------ */}
      {/* SOCIAL ICONS */}
      {/* ------------------------------------------------ */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-xl font-semibold text-black">
            Social Icons
          </h2>

          <button
            type="button"
            onClick={addSocialIcon}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            + Add Social
          </button>

        </div>

        <div className="space-y-4">

          {socialIcons.map(
            (social, index) => (
              <div
                key={index}
                className="rounded-lg border p-4"
              >
                <div className="grid gap-4 md:grid-cols-[200px_1fr_auto]">

                  <input
                    type="text"
                    placeholder="linkedin"
                    value={
                      social.icon_type
                    }
                    onChange={(e) =>
                      updateSocialIcon(
                        index,
                        "icon_type",
                        e.target.value
                      )
                    }
                    className="rounded-lg border p-3 text-black"
                  />

                  <input
                    type="url"
                    placeholder="https://linkedin.com/..."
                    value={
                      social.social_network_url
                    }
                    onChange={(e) =>
                      updateSocialIcon(
                        index,
                        "social_network_url",
                        e.target.value
                      )
                    }
                    className="rounded-lg border p-3 text-black"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeSocialIcon(
                        index
                      )
                    }
                    className="rounded-lg border px-4 py-2 text-red-600"
                  >
                    Remove
                  </button>

                </div>
              </div>
            )
          )}

          {socialIcons.length === 0 && (
            <p className="text-gray-500">
              No social links added.
            </p>
          )}

        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* COUNT */}
      {/* ------------------------------------------------ */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-xl font-semibold text-black">
          Other
        </h2>

        <label className="mb-2 block font-medium text-black">
          Count
        </label>

        <input
          type="text"
          value={form.count}
          onChange={(e) =>
            updateField(
              "count",
              e.target.value
            )
          }
          className="w-full rounded-lg border p-3 text-black"
          placeholder="1"
        />

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>
            Verification status:
          </strong>{" "}
          This profile will automatically be
          created as{" "}
          <strong>unverified</strong>.
        </div>

      </section>

      {/* ------------------------------------------------ */}
      {/* SUBMIT */}
      {/* ------------------------------------------------ */}

      <div className="flex justify-end">

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-8 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? "Creating..."
            : "Create Profile"}
        </button>

      </div>

    </form>
  );
}
