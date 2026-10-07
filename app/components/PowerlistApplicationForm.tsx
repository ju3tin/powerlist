"use client";

import { FormEvent, useState } from "react";

interface PowerlistApplicationFormProps {
  email?: string;
  firstName?: string;
  lastName?: string;
  linkedinUrl?: string;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string;
  profile?: {
    _id?: string;
    id?: number;
    title?: string;
    email?: string;
    slug?: string;
  };
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

  // API response shown directly on screen
  const [apiResponse, setApiResponse] =
    useState<ApiResponse | null>(null);

  const [apiStatus, setApiStatus] =
    useState<number | null>(null);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    // Clear previous API response when user changes
    // the form and tries again.
    setApiResponse(null);
    setApiStatus(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setApiResponse(null);
    setApiStatus(null);

    try {
      const title =
        `${form.firstName} ${form.lastName}`.trim();

      if (!title) {
        setApiResponse({
          success: false,
          error:
            "Please enter your first and last name.",
          code: "VALIDATION_ERROR",
        });

        return;
      }

      const payload = {
        title,

        email: form.email
          .trim()
          .toLowerCase(),

        artist_title:
          form.jobTitle.trim(),

        power_list_category:
          form.category.trim(),

        link:
          form.website.trim() ||
          undefined,

        social_icons:
          form.linkedinUrl.trim()
            ? [
                {
                  icon_type: "linkedin",
                  social_network_url:
                    form.linkedinUrl.trim(),
                },
              ]
            : [],

        other: [
          {
            other_type: "company",
            other_type_value:
              form.company.trim(),
          },
          {
            other_type: "application_reason",
            other_type_value:
              form.reason.trim(),
          },
        ],
      };

      console.log(
        "POWERLIST API REQUEST:",
        payload
      );

      const response = await fetch(
        "/api/powerlist/add-user",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(payload),
        }
      );

      setApiStatus(response.status);

      const responseText =
        await response.text();

      console.log(
        "POWERLIST API STATUS:",
        response.status
      );

      console.log(
        "POWERLIST API RESPONSE:",
        responseText
      );

      let data: ApiResponse;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {
              success: false,
              error:
                "The API returned an empty response.",
            };
      } catch {
        data = {
          success: false,
          error:
            responseText ||
            "The API returned an invalid JSON response.",
        };
      }

      // Store EXACT API response
      setApiResponse(data);

      if (!response.ok) {
        return;
      }

      if (data.success !== true) {
        return;
      }
    } catch (error) {
      console.error(
        "POWERLIST API REQUEST FAILED:",
        error
      );

      setApiStatus(null);

      setApiResponse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect to the API.",
        code: "NETWORK_ERROR",
      });
    } finally {
      setLoading(false);
    }
  }

  const success =
    apiResponse?.success === true;

  const error =
    apiResponse?.success === false;

  return (
    <div className="mx-auto w-full max-w-2xl">

      {/* ------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------ */}

      <div className="mb-8 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Women in FinTech Powerlist
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
          We'd still love to hear from you
        </h1>

        <div className="mt-5 space-y-3 text-black">
          <p>
            Unfortunately, you didn't make the
            Powerlist this time.
          </p>

          <p>
            But that doesn't mean this is the end
            of the road. We'd love to learn a
            little more about you and your work.
          </p>

          <p>
            Fill in the form below and we may be
            able to add you to this year's
            Powerlist, or consider you for next
            year's list.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* API RESPONSE */}
      {/* ------------------------------------------------ */}

      {apiResponse && (
        <div
          className={`mb-6 rounded-xl border p-5 ${
            success
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2
              className={`text-lg font-bold ${
                success
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {success
                ? "API Response — Success"
                : "API Response — Error"}
            </h2>

            {apiStatus && (
              <span
                className={`rounded-md px-2 py-1 text-xs font-bold ${
                  success
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                HTTP {apiStatus}
              </span>
            )}
          </div>

          {/* Main API message */}

          {apiResponse.message && (
            <p
              className={`mb-2 font-medium ${
                success
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {apiResponse.message}
            </p>
          )}

          {apiResponse.error && (
            <p className="mb-2 font-medium text-red-800">
              {apiResponse.error}
            </p>
          )}

          {/* API code */}

          {apiResponse.code && (
            <p className="mb-3 text-sm text-gray-700">
              <strong>Code:</strong>{" "}
              {apiResponse.code}
            </p>
          )}

          {/* Created profile */}

          {apiResponse.profile && (
            <div className="mt-4 rounded-lg border border-green-200 bg-white p-4 text-sm text-black">
              <h3 className="mb-3 font-semibold">
                Profile returned by API
              </h3>

              {apiResponse.profile.id !==
                undefined && (
                <p>
                  <strong>ID:</strong>{" "}
                  {apiResponse.profile.id}
                </p>
              )}

              {apiResponse.profile.title && (
                <p>
                  <strong>Name:</strong>{" "}
                  {apiResponse.profile.title}
                </p>
              )}

              {apiResponse.profile.email && (
                <p>
                  <strong>Email:</strong>{" "}
                  {apiResponse.profile.email}
                </p>
              )}

              {apiResponse.profile.slug && (
                <p>
                  <strong>Slug:</strong>{" "}
                  {apiResponse.profile.slug}
                </p>
              )}

              {apiResponse.profile._id && (
                <p className="break-all">
                  <strong>Mongo ID:</strong>{" "}
                  {apiResponse.profile._id}
                </p>
              )}
            </div>
          )}

          {/* Raw JSON */}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-black">
              View raw API response
            </summary>

            <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-black p-4 text-xs text-white">
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
      {/* FORM */}
      {/* ------------------------------------------------ */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
      >

        {/* First / Last */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Smith"
            />
          </div>

        </div>

        {/* Email */}

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Email address
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              updateField(
                "email",
                e.target.value
              )
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        {/* LinkedIn */}

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.linkedin.com/in/your-name/"
          />
        </div>

        {/* Job title */}

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CEO, CTO, Founder..."
          />
        </div>

        {/* Company */}

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Company name"
          />
        </div>

        {/* Category */}

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="mb-2 block text-sm font-medium text-black">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://yourcompany.com"
          />
        </div>

        {/* Reason */}

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Tell us about yourself
          </label>

          <p className="mb-3 text-sm text-gray-600">
            Tell us about your achievements,
            experience and impact in fintech.
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
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about your work, achievements and impact..."
          />
        </div>

        {/* Submit */}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit for consideration"}
        </button>

        <p className="text-center text-xs text-gray-500">
          Submitting this form does not guarantee
          inclusion in the Powerlist. All
          submissions are subject to review.
        </p>

      </form>
    </div>
  );
}
