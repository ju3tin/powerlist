"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SocialIcon {
  icon_type?: string;
  social_network_url?: string;
}

interface Profile {
  _id: string;
  id?: number;
  title?: string;
  artist_title?: string;
  content?: string;
  slug?: string;
  full_slug?: string;
  link?: string;
  power_list_category?: string;
  featured_image?: string;
  company_logo?: string;
  count?: string | number;
  date?: string;
  social_icons?: SocialIcon[];
}

export default function WomenInTechProfilePage() {
  const params = useParams();
  const type = params.type as string;
  const value = params.value as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !value) return;

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const query = `?${type}=${encodeURIComponent(value)}`;
        const res = await fetch(`/api/profiles2${query}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch profile");
        }

        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setProfile(data[0]);
        } else {
          setError("Profile not found");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [type, value]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-200/70 text-sm tracking-wide">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-white">Profile not found</h1>
          <p className="text-purple-200/60">{error || "We couldn’t find this profile."}</p>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition"
          >
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-purple-300/70 hover:text-purple-200 transition mb-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Women in Tech
        </Link>

        {/* Main card */}
        <article className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/40">
          {/* Top banner */}
          <div className="h-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500" />

          <div className="p-6 sm:p-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Avatar / Featured image */}
              <div className="relative shrink-0">
                {profile.featured_image ? (
                  <img
                    src={profile.featured_image}
                    alt={profile.title || "Profile"}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover ring-4 ring-purple-500/30 shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl font-bold text-white/90">
                    {(profile.title || "?").charAt(0)}
                  </div>
                )}

                {/* Company logo badge */}
                {profile.company_logo && (
                  <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-xl bg-white p-1.5 shadow-lg">
                    <img
                      src={profile.company_logo}
                      alt="Company"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {profile.title || "Untitled"}
                  </h1>
                  {profile.artist_title && (
                    <p className="mt-1 text-lg text-purple-200/80 font-medium">
                      {profile.artist_title}
                    </p>
                  )}
                </div>

                {/* Category badge */}
                {profile.power_list_category && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {profile.power_list_category}
                  </span>
                )}

                {/* Social icons row */}
                {profile.social_icons && profile.social_icons.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {profile.social_icons.map((icon, i) => {
                      if (!icon.social_network_url) return null;
                      return (
                        <a
                          key={i}
                          href={icon.social_network_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/40 text-purple-100 transition"
                        >
                          <span className="capitalize font-medium">
                            {icon.icon_type || "Link"}
                          </span>
                          <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Bio / Content */}
            {profile.content && (
              <div className="prose prose-invert prose-purple max-w-none">
                <div
                  className="text-purple-50/90 leading-relaxed text-[15px] sm:text-base"
                  dangerouslySetInnerHTML={{ __html: profile.content }}
                />
              </div>
            )}

            {/* Footer meta */}
            <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap gap-x-8 gap-y-3 text-sm text-purple-200/50">
              {profile.date && (
                <div>
                  <span className="text-purple-300/40">Listed</span>{" "}
                  <span className="text-purple-100/80">{profile.date}</span>
                </div>
              )}
              {profile.slug && (
                <div>
                  <span className="text-purple-300/40">Slug</span>{" "}
                  <span className="text-purple-100/80 font-mono text-xs">{profile.slug}</span>
                </div>
              )}
              {profile.id !== undefined && (
                <div>
                  <span className="text-purple-300/40">ID</span>{" "}
                  <span className="text-purple-100/80">{profile.id}</span>
                </div>
              )}
              {profile.link && (
                <div>
                  <a
                    href={profile.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-300 hover:text-purple-200 transition underline underline-offset-2"
                  >
                    View original
                  </a>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Bottom branding */}
        <p className="mt-10 text-center text-xs text-purple-400/40 tracking-widest uppercase">
          Women in Tech · Power List
        </p>
      </div>
    </div>
  );
}