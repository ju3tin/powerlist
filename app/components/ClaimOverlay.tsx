"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  BriefcaseBusiness,
  X,
} from "lucide-react";

function ClaimOverlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shouldClaim =
    searchParams.get("claim") === "true";

  const [isOpen, setIsOpen] =
    useState(false);

  const [linkedinUrl, setLinkedinUrl] =
    useState("");

  const [claimError, setClaimError] =
    useState("");

  const [claimLoading, setClaimLoading] =
    useState(false);

  /*
   * Open automatically when:
   *
   * /?claim=true
   */
  useEffect(() => {
    if (shouldClaim) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [shouldClaim]);

  /*
   * Don't render anything normally.
   */
  if (!isOpen || !shouldClaim) {
    return null;
  }

  async function handleClaim(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setClaimError("");

    if (!linkedinUrl.trim()) {
      setClaimError(
        "Please enter your LinkedIn profile URL."
      );
      return;
    }

    setClaimLoading(true);

    try {
      const response = await fetch(
        "/api/claimprofile",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            linkedinUrl:
              linkedinUrl.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setClaimError(
          data.error ||
            "Unable to claim profile."
        );
        return;
      }

      /*
       * Claim successful.
       *
       * Send user to their Powerlist profile.
       */
      if (data.profile?.slug) {
        router.push(
          `/profiles/${data.profile.slug}`
        );
      }
    } catch (error) {
      console.error(
        "Claim error:",
        error
      );

      setClaimError(
        "Something went wrong. Please try again."
      );
    } finally {
      setClaimLoading(false);
    }
  }

  function closeOverlay() {
    setIsOpen(false);

    /*
     * Remove ?claim=true from the URL.
     */
    router.replace("/");
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#10253f]/45 p-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeOverlay();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-title"
        className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={closeOverlay}
          className="absolute right-5 top-5 rounded-full p-2 text-[#8a9bab] hover:bg-[#f2f5f8]"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="grid size-14 place-items-center rounded-2xl bg-[#eaf3ff] text-[#0a66c2]">
          <BriefcaseBusiness className="size-7" />
        </div>

        <h2
          id="claim-title"
          className="mt-7 text-3xl font-semibold tracking-[-.05em] text-[#10253f]"
        >
          Claim your profile
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#718294]">
          Your LinkedIn account has been
          authenticated, but we couldn't find
          your email on a Powerlist profile.
        </p>

        <p className="mt-3 text-sm leading-6 text-[#718294]">
          Enter the LinkedIn profile URL listed
          on your Powerlist profile to claim it.
        </p>

        <form
          onSubmit={handleClaim}
          className="mt-7"
        >
          <label
            htmlFor="claim-linkedin-url"
            className="text-xs font-bold uppercase tracking-[.14em] text-[#5f7183]"
          >
            LinkedIn profile URL
          </label>

          <input
            id="claim-linkedin-url"
            type="url"
            value={linkedinUrl}
            onChange={(event) => {
              setLinkedinUrl(
                event.target.value
              );
              setClaimError("");
            }}
            placeholder="https://www.linkedin.com/in/your-name/"
            className="mt-2 w-full rounded-2xl border border-[#dfe5eb] px-4 py-3 text-sm text-[#10253f] outline-none ring-[#1e63f1] focus:ring-2"
            autoComplete="url"
            required
          />

          {claimError && (
            <div className="mt-4 rounded-2xl bg-[#fff1f1] p-4 text-sm text-[#9b2c2c]">
              {claimError}
            </div>
          )}

          <button
            type="submit"
            disabled={claimLoading}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-[#0a66c2] px-5 py-4 text-sm font-bold text-white hover:bg-[#084f96] disabled:cursor-wait disabled:opacity-60"
          >
            <BriefcaseBusiness className="size-5" />

            {claimLoading
              ? "Claiming profile..."
              : "Claim profile"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#9aa8b5]">
          Your email is taken from your
          authenticated LinkedIn account. It
          cannot be entered manually.
        </p>
      </div>
    </div>
  );
}

/*
 * IMPORTANT:
 *
 * useSearchParams() is inside this component,
 * and the component is wrapped in Suspense.
 */
export default function ClaimOverlay() {
  return (
    <Suspense fallback={null}>
      <ClaimOverlayContent />
    </Suspense>
  );
}