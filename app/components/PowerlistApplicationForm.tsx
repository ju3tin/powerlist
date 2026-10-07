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
      const response = await fetch(
        "/api/powerlist/apply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Something went wrong. Please try again."
        );
      }

      setSubmitted(true);
    } catch (error) {
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">
          Thank you for applying
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          We've received your details and will keep
          your information in consideration for the
          Women in FinTech Powerlist.
        </p>

        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
          You may be considered for this year's
          Powerlist or a future Powerlist.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Introduction */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          We'd still love to hear from you
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-gray-600 leading-relaxed">
          Unfortunately, you didn't make the Powerlist
          this time. However, that doesn't mean this
          is the end of the road.
        </p>

        <p className="mx-auto mt-3 max-w-xl text-gray-600 leading-relaxed">
          Fill in the form below and tell us a little
          more about yourself. We may be able to add
          you to the Powerlist this year, or consider
          you for next year's list.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm md:p-8"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            Website
            <span className="ml-2 font-normal text-gray-400">
              Optional
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="https://yourcompany.com"
          />
        </div>

        {/* About */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Tell us about yourself
          </label>

          <p className="mb-2 text-sm text-gray-500">
            Tell us about your achievements,
            experience and why you feel you should be
            considered for the Powerlist.
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
            rows={6}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
          className="w-full rounded-lg bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit for consideration"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Submission does not guarantee inclusion in
          the Powerlist. All applications are subject
          to review.
        </p>
      </form>
    </div>
  );
}