"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const formSchema = z.object({
  title: z.string().min(2, "Title / Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  artist_title: z.string().optional(),
  date: z.string().optional(),
  content: z.string().optional(),
  power_list_category: z.string().optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  count: z.string().optional(),
  company_logo: z.string().optional(),
  featured_image: z.string().optional(),
  social_icons: z
    .array(
      z.object({
        icon_type: z.string().min(1, "Icon type required"),
        social_network_url: z.string().url("Must be a valid URL").or(z.literal("")),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PowerlistRequestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      social_icons: [{ icon_type: "", social_network_url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "social_icons",
  });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    setErrorMessage("");

    // Clean empty social icons
    const cleaned = {
      ...data,
      social_icons: data.social_icons?.filter(
        (s) => s.icon_type && s.social_network_url
      ),
    };

    try {
      const res = await fetch("/api/powerlist-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof json.error === "string" ? json.error : "Something went wrong"
        );
      }

      setStatus("success");
      reset();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to submit");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <h3 className="text-xl font-semibold text-green-800">Request submitted!</h3>
        <p className="mt-2 text-green-700">
          Your profile has been created with Auth = none. We’ll review it soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title / Name *</label>
        <input
          {...register("title")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="Jane Doe"
        />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="jane@example.com"
        />
        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      {/* Artist Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Artist Title / Role</label>
        <input
          {...register("artist_title")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="Founder & CEO"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input
          {...register("date")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="2025 or any text"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium mb-1">Content / Bio</label>
        <textarea
          {...register("content")}
          rows={4}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="Short bio or description..."
        />
      </div>

      {/* Power List Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Power List Category</label>
        <input
          {...register("power_list_category")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="e.g. Technology, Arts, Business..."
        />
      </div>

      {/* Link */}
      <div>
        <label className="block text-sm font-medium mb-1">Website / Link</label>
        <input
          {...register("link")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="https://..."
        />
        {errors.link && <p className="text-sm text-red-600 mt-1">{errors.link.message}</p>}
      </div>

      {/* Count */}
      <div>
        <label className="block text-sm font-medium mb-1">Count</label>
        <input
          {...register("count")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="Any number or text"
        />
      </div>

      {/* Company Logo URL */}
      <div>
        <label className="block text-sm font-medium mb-1">Company Logo URL</label>
        <input
          {...register("company_logo")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="https://..."
        />
      </div>

      {/* Featured Image URL */}
      <div>
        <label className="block text-sm font-medium mb-1">Featured Image URL</label>
        <input
          {...register("featured_image")}
          className="w-full rounded-lg border px-4 py-2.5"
          placeholder="https://..."
        />
      </div>

      {/* Social Icons */}
      <div>
        <label className="block text-sm font-medium mb-2">Social Icons</label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 mb-3">
            <input
              {...register(`social_icons.${index}.icon_type`)}
              placeholder="e.g. twitter, linkedin, instagram"
              className="flex-1 rounded-lg border px-3 py-2"
            />
            <input
              {...register(`social_icons.${index}.social_network_url`)}
              placeholder="https://..."
              className="flex-1 rounded-lg border px-3 py-2"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="px-3 text-red-600 hover:bg-red-50 rounded"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ icon_type: "", social_network_url: "" })}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add social link
        </button>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-black text-white py-3.5 font-medium hover:bg-gray-800 disabled:opacity-60 transition"
      >
        {status === "loading" ? "Submitting..." : "Submit Profile Request"}
      </button>
    </form>
  );
}