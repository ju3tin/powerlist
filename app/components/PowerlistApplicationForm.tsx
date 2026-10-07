"use client";

import { FormEvent, useState } from "react";

interface PowerlistApplicationFormProps {
  email?: string;
  firstName?: string;
  lastName?: string;
  linkedinUrl?: string;
}

export default function PowerlistApplicationForm({
  email = "",
  firstName = "",
  lastName = "",
  linkedinUrl = "",
}: PowerlistApplicationFormProps) {
  const [form, setForm] = useState({
    firstName,
    lastName,
    email,
    linkedinUrl,
    jobTitle: "",
    company: "",
    category: "",
    website: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      /*
       * Convert the application into the Profile
       * structure expected by /api/powerlist/add-user.
       */
      const response = await fetch(
        "/api/powerlist/add-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: `${form.firstName} ${form.lastName}`.trim(),

            email: form.email,

            artist_title: form.jobTitle,

            power_list_category: form.category,

            link: form.website || undefined,

            social_icons: form.linkedinUrl
              ? [
                  {
                    icon_type: "linkedin",
                    social_network_url:
                      form.linkedinUrl,
                  },
                ]
              : [],

            other: [
              {
                other_type: "application_reason",
                other_type_value: form.reason,
              },

              {
                other_type: "company",
                other_type_value: form.company,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to submit your application."
        );
      }

      setSubmitted(true);
    } catch (error) {
      console.error(
        "Powerlist application failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
          ✓
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          Thank you
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          We've received your details and will keep
          you in consideration for the Women in
          FinTech Powerlist.
        </p>

        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          We may be able to add you to this year's
          Powerlist, or consider you for next year's
          list.
        </p>

        <p className="mt-6 text-sm text-gray-500">
          Your profile has been added for review as an
          unverified Powerlist entry.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Introduction */}
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Women in FinTech Powerlist
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          We'd still love to hear from you
        </h1>

        <div className="mt-5 space-y-3 text-gray-600 leading-relaxed">
          <p>
            Unfortunately, you didn't make the
            Powerlist this time.
          </p>

          <p>
            But that doesn't mean this is the end of
            the road. We'd love to learn a little more
            about you and your work.
          </p>

          <p>
            Fill in the form below and we may be able
            to add you to this year's Powerlist, or
            consider you for next year's list.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
      >
        {/* Name */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              First name
            </label>

            <input
              type="text"
              value={form.firstName}
              onChange={(e) =>
                updateField(
                  "firstName",
                  e.target.value
                )
              }
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Jane"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Last name
            </label>

            <input
              type="text"
              value={form.lastName}
              onChange={(e) =>
                updateField(
                  "lastName",
                  e.target.value
                )
              }
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Smith"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Email address
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="you@example.com"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            LinkedIn profile
          </label>

          <input
            type="url"
            value={form.linkedinUrl}
            onChange={(e) =>
              updateField(
                "linkedinUrl",
                e.target.value
              )
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="https://www.linkedin.com/in/your-name/"
          />
        </div>

        {/* Job title */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Job title
          </label>

          <input
            type="text"
            value={form.jobTitle}
            onChange={(e) =>
              updateField(
                "jobTitle",
                e.target.value
              )
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. CEO, CTO, Founder"
          />
        </div>

        {/* Company */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Company
          </label>

          <input
            type="text"
            value={form.company}
            onChange={(e) =>
              updateField(
                "company",
                e.target.value
              )
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Company name"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Powerlist category
          </label>

          <select
            value={form.category}
            onChange={(e) =>
              updateField(
                "category",
                e.target.value
              )
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              Select a category
            </option>

            <option value="Senior">
              Senior
            </option>

            <option value="Rising Star">
              Rising Star
            </option>

            <option value="Entrepreneur">
              Entrepreneur
            </option>

            <option value="Investor">
              Investor
            </option>

            <option value="Founder">
              Founder
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        {/* Website */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Website{" "}
            <span className="font-normal text-gray-400">
              (optional)
            </span>
          </label>

          <input
            type="url"
            value={form.website}
            onChange={(e) =>
              updateField(
                "website",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="https://yourcompany.com"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Tell us about yourself
          </label>

          <p className="mb-3 text-sm text-gray-500">
            Tell us about your achievements,
            experience and impact in fintech. This will
            help us consider your application.
          </p>

          <textarea
            value={form.reason}
            onChange={(e) =>
              updateField(
                "reason",
                e.target.value
              )
            }
            required
            rows={7}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Tell us about your work, achievements and impact..."
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit for consideration"}
        </button>

        <p className="text-center text-xs leading-relaxed text-gray-400">
          Submitting this form does not guarantee
          inclusion in the Powerlist. All submissions
          are subject to review.
        </p>
      </form>
    </div>
  );
}