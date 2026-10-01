
import { redirect } from "next/navigation";

import {
  getAuthenticatedProfile,
} from "@/lib/linkedin-auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // Authentication is checked on the server.
  // The browser cannot choose which profile to load.
  const auth = await getAuthenticatedProfile();

  if (!auth) {
    redirect("/");
  }

  const { profile, session } = auth;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#10253f]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1e63f1]">
              Women in FinTech Powerlist 2026
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-[#718294]">
              Your authenticated Powerlist profile
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="rounded-full border border-[#dfe5eb] bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-[#f2f5f8]"
            >
              Home
            </a>

            <a
              href="/api/auth/logout"
              className="rounded-full bg-[#10253f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3855]"
            >
              Sign out
            </a>
          </div>
        </header>

        {/* Profile card */}
        <section className="overflow-hidden rounded-3xl border border-[#dfe5eb] bg-white shadow-sm">
          {/* Featured image */}
          {profile.featured_image && (
            <div className="h-64 overflow-hidden bg-[#eef2f6]">
              <img
                src={profile.featured_image}
                alt={profile.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Profile heading */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {profile.featured_image && (
                <img
                  src={profile.featured_image}
                  alt={profile.title}
                  className="size-28 rounded-2xl object-cover shadow-md sm:-mt-20"
                />
              )}

              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {profile.title}
                </h2>

                {profile.artist_title && (
                  <p className="mt-2 text-lg text-[#718294]">
                    {profile.artist_title}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            {profile.power_list_category && (
              <div className="mt-6">
                <span className="inline-flex rounded-full bg-[#eff4ff] px-3 py-1.5 text-xs font-bold text-[#1e63f1]">
                  {profile.power_list_category}
                </span>
              </div>
            )}

            {/* Authentication information */}
            <div className="mt-8 rounded-2xl border border-[#dfe5eb] bg-[#f7f8fa] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718294]">
                Authenticated LinkedIn account
              </p>

              <p className="mt-2 text-sm font-semibold text-[#10253f]">
                {session.email}
              </p>

              <p className="mt-2 text-xs leading-5 text-[#718294]">
                This email was retrieved from your secure server-side
                LinkedIn session. It is not taken from the browser.
              </p>
            </div>

            {/* About */}
            {profile.content && (
              <div className="mt-8">
                <h3 className="text-lg font-bold">
                  About
                </h3>

                <div
                  className="mt-4 text-sm leading-7 text-[#627487]"
                  dangerouslySetInnerHTML={{
                    __html: profile.content,
                  }}
                />
              </div>
            )}

            {/* Social links */}
            {profile.social_icons?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold">
                  Links
                </h3>

                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.social_icons.map(
                    (
                      social: {
                        icon_type?: string;
                        social_network_url?: string;
                      },
                      index: number
                    ) => {
                      if (
                        !social.social_network_url
                      ) {
                        return null;
                      }

                      return (
                        <a
                          key={`${social.icon_type || "link"}-${index}`}
                          href={
                            social.social_network_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[#dfe5eb] bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-[#f2f5f8]"
                        >
                          {social.icon_type ||
                            "Link"}
                        </a>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Public profile */}
            {profile.slug && (
              <div className="mt-8 border-t border-[#e5e9ee] pt-8">
                <a
                  href={`/profiles/${profile.slug}`}
                  className="inline-flex rounded-full bg-[#1e63f1] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1555d5]"
                >
                  View public Powerlist profile
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
