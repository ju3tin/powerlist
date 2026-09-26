"use client";

import { FormEvent, useState } from "react";

type SocialIcon = {
  icon_type: string;
  social_network_url: string;
};

export default function ProfileForm() {
  const [form, setForm] = useState({
    id: "",
    title: "",
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

  const [socialIcons, setSocialIcons] = useState<SocialIcon[]>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      slug: previous.slug || generateSlug(value),
    }));
  }

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
      previous.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/singleprofile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id: Number(form.id),
          social_icons: socialIcons,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create profile");
      }

      setMessage("Profile created successfully.");

      // Reset form
      setForm({
        id: "",
        title: "",
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
      setMessage(error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold">
          Add Profile
        </h1>

        <p className="mt-2 text-gray-500">
          Create a single profile.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border bg-gray-50 p-4">
          {message}
        </div>
      )}

      {/* Basic information */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Profile Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Profile ID *
            </label>

            <input
              type="number"
              required
              value={form.id}
              onChange={(e) =>
                updateField("id", e.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Date
            </label>

            <input
              type="text"
              placeholder="2026"
              value={form.date}
              onChange={(e) =>
                updateField("date", e.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Title *
            </label>

            <input
              type="text"
              required
              value={form.title}
              onChange={(e) =>
                handleTitleChange(e.target.value)
              }
              className="w-full rounded-lg border p-3"
              placeholder="Rachel Logan"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
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
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Power List Category
            </label>

            <input
              type="text"
              value={form.power_list_category}
              onChange={(e) =>
                updateField(
                  "power_list_category",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3"
              placeholder="Women in FinTech"
            />
          </div>
        </div>
      </section>

      {/* Slugs */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          URLs
        </h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Slug *
            </label>

            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) =>
                updateField("slug", e.target.value)
              }
              className="w-full rounded-lg border p-3"
              placeholder="rachel-logan"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
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
              className="w-full rounded-lg border p-3"
              placeholder="/women-in-fintech/rachel-logan"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Link
            </label>

            <input
              type="url"
              value={form.link}
              onChange={(e) =>
                updateField("link", e.target.value)
              }
              className="w-full rounded-lg border p-3"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </section>

      {/* Images */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Images
        </h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Featured Image
            </label>

            <input
              type="url"
              value={form.featured_image}
              onChange={(e) =>
                updateField(
                  "featured_image",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3"
              placeholder="https://..."
            />

            {form.featured_image && (
              <img
                src={form.featured_image}
                alt="Preview"
                className="mt-4 h-48 w-full rounded-lg object-cover"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Company Logo
            </label>

            <input
              type="url"
              value={form.company_logo}
              onChange={(e) =>
                updateField(
                  "company_logo",
                  e.target.value
                )
              }
              className="w-full rounded-lg border p-3"
              placeholder="https://..."
            />

            {form.company_logo && (
              <img
                src={form.company_logo}
                alt="Company logo"
                className="mt-4 h-24 max-w-xs object-contain"
              />
            )}
          </div>
        </div>
      </section>

      {/* Content */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Content
        </h2>

        <textarea
          value={form.content}
          onChange={(e) =>
            updateField("content", e.target.value)
          }
          rows={12}
          className="w-full rounded-lg border p-3"
          placeholder="Profile content..."
        />
      </section>

      {/* Social icons */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
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
          {socialIcons.map((social, index) => (
            <div
              key={index}
              className="rounded-lg border p-4"
            >
              <div className="grid gap-4 md:grid-cols-[200px_1fr_auto]">
                <input
                  type="text"
                  placeholder="linkedin"
                  value={social.icon_type}
                  onChange={(e) =>
                    updateSocialIcon(
                      index,
                      "icon_type",
                      e.target.value
                    )
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="url"
                  placeholder="https://linkedin.com/..."
                  value={social.social_network_url}
                  onChange={(e) =>
                    updateSocialIcon(
                      index,
                      "social_network_url",
                      e.target.value
                    )
                  }
                  className="rounded-lg border p-3"
                />

                <button
                  type="button"
                  onClick={() =>
                    removeSocialIcon(index)
                  }
                  className="rounded-lg border px-4 py-2 text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {socialIcons.length === 0 && (
            <p className="text-gray-500">
              No social links added.
            </p>
          )}
        </div>
      </section>

      {/* Other */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Other
        </h2>

        <label className="mb-2 block font-medium">
          Count
        </label>

        <input
          type="text"
          value={form.count}
          onChange={(e) =>
            updateField("count", e.target.value)
          }
          className="w-full rounded-lg border p-3"
          placeholder="1"
        />
      </section>

      {/* Submit */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-8 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Profile"}
        </button>
      </div>
    </form>
  );
}