"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "@/components/hero1";
import PageStyle from "./PageStyle";
import ClaimOverlay from "@/app/components/ClaimOverlay";
import {
  BriefcaseBusiness,
  Check,
  Copy,
  Menu,
  X,
} from "lucide-react";

type CoreProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
  on?: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
};

declare global {
  interface Window {
    avalanche?: CoreProvider;
  }
}

interface NFTSelection {
  _id: string;
  profileId: string;
  recipientSelected: boolean;
  name: string;
  jobTitle?: string;
  imageUrl?: string;
}

interface LinkedInProfileResponse {
  authenticated?: boolean;
  hasProfile?: boolean;
  profile?: {
    id?: number;
    title?: string;
    slug?: string;
    profileId?: string;
    artist_title?: string;
    featured_image?: string;
    power_list_category?: string;
  };
}

interface NFTSelectionsResponse {
  selections?: NFTSelection[] | NFTSelection | null;
}

const steps = [
  {
    number: "01",
    title: "Verify your profile",
    text: "Sign in securely with LinkedIn to confirm your place in the community.",
  },
  {
    number: "02",
    title: "Create your ticket",
    text: "Your unique Powerlist 2026 ticket is minted on Avalanche.",
  },
  {
    number: "03",
    title: "Keep it forever",
    text: "Add your ticket to Core Wallet and bring it with you to the celebration.",
  },
];

export default function Page() {
  const router = useRouter();

  // LinkedIn authentication
  const [isLinkedInAuthenticated, setIsLinkedInAuthenticated] =
    useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Core Wallet
  const [walletAddress, setWalletAddress] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [walletError, setWalletError] = useState("");

  // Page UI
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // NFT recipient state
  const [matchedRecipients, setMatchedRecipients] =
    useState<NFTSelection[]>([]);
  const [hasSelectedRecipients, setHasSelectedRecipients] =
    useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] =
    useState(true);
  const [recipientError, setRecipientError] = useState("");

  // Existing Powerlist badge state
  const [verifiedProfile, setVerifiedProfile] = useState<{
    title: string;
    artist_title?: string;
    featured_image?: string;
    profileId?: string;
  } | null>(null);

  const [badgeClaimed, setBadgeClaimed] = useState(false);

  // LinkedIn login
  const handleLogin = () => {
    window.location.href = "/api/linkedin/login";
  };

  // Connect Core Wallet
  const connectCoreWallet = async () => {
    setWalletError("");

    try {
      const provider = window.avalanche;

      if (!provider) {
        window.open("https://core.app/", "_blank");

        setWalletError(
          "Core Wallet not detected. Install the Core browser extension and try again."
        );
        return;
      }

      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts?.length) {
        setWalletError("No wallet account was returned.");
        return;
      }

      setWalletAddress(accounts[0]);
      setIsCopied(false);
    } catch (error) {
      setWalletError(
        error instanceof Error
          ? error.message
          : "Unable to connect Core Wallet."
      );
    }
  };

  // Copy wallet address
  const copyAddress = async () => {
    if (!walletAddress) {
      await connectCoreWallet();
      return;
    }

    try {
      await navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setWalletError("Unable to copy wallet address.");
    }
  };

  // Restore an existing Core Wallet connection
  useEffect(() => {
    const provider = window.avalanche;

    if (!provider) return;

    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;

      setWalletAddress(accounts?.[0] ?? "");
      setIsCopied(false);
    };

    provider.on?.("accountsChanged", handleAccounts);

    provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const list = accounts as string[];
        setWalletAddress(list?.[0] ?? "");
      })
      .catch(() => {});

    return () => {
      provider.removeListener?.("accountsChanged", handleAccounts);
    };
  }, []);

  // Fetch LinkedIn profile and selected NFT recipients
  useEffect(() => {
    let cancelled = false;

    async function checkRecipients() {
      setIsLoadingRecipients(true);
      setRecipientError("");

      try {
        // 1. Fetch the LinkedIn profile
        const profileResponse = await fetch(
          "/api/linkedin/profile",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch LinkedIn profile.");
        }

        const profileData: LinkedInProfileResponse =
          await profileResponse.json();

        if (cancelled) return;

        // IMPORTANT: profileId is inside profile
        const profileId = profileData.profile?.profileId;

        const profileExists =
          profileData.authenticated === true &&
          profileData.hasProfile === true &&
          Boolean(profileId);

        setHasProfile(profileExists);
        setIsLinkedInAuthenticated(
          profileData.authenticated === true
        );

        // No valid LinkedIn profile: clear the recipient state
        if (!profileExists || !profileId) {
          setMatchedRecipients([]);
          setHasSelectedRecipients(false);
          return;
        }

        // 2. Fetch NFT selections
        const selectionsResponse = await fetch(
          "/api/nft-selections",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!selectionsResponse.ok) {
          throw new Error("Failed to fetch NFT selections.");
        }

        const selectionsData: NFTSelectionsResponse =
          await selectionsResponse.json();

        if (cancelled) return;

        // 3. Normalize the API response to an array
        const selections: NFTSelection[] = Array.isArray(
          selectionsData.selections
        )
          ? selectionsData.selections
          : selectionsData.selections
            ? [selectionsData.selections]
            : [];

        // 4. Match the logged-in profile and selected recipients
        const recipients = selections.filter(
          (selection) =>
            selection.profileId === profileId &&
            selection.recipientSelected === true
        );

        // 5. Save the results in React state
        setMatchedRecipients(recipients);
        setHasSelectedRecipients(recipients.length > 0);

        // Debugging
        console.log("LinkedIn profile ID:", profileId);
        console.log("Matched recipients:", recipients);
        console.log(
          "Has selected recipients:",
          recipients.length > 0
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Recipient check failed:", error);

          setMatchedRecipients([]);
          setHasSelectedRecipients(false);
          setRecipientError(
            "We couldn't check your recipient status. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRecipients(false);
          setAuthChecked(true);
        }
      }
    }

    checkRecipients();

    return () => {
      cancelled = true;
    };
  }, []);

  // Make Ticket button handler
  // Connect this handler to your actual ticket-minting API or flow.
  const handleMakeTicket = (recipient: NFTSelection) => {
    console.log("Make Ticket clicked for recipient:", recipient);

    // TODO: Call your ticket creation/minting endpoint here.
    // The ticket API endpoint and required payload were not provided.
  };

  return (
    <>
      <PageStyle />

      <main className="min-h-screen overflow-hidden bg-[#f7f8fa] text-[#10253f]">
        {/* HEADER */}
        <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6 lg:px-10">
          <a
            href="#top"
            className="flex items-center gap-3"
            aria-label="Innovate Finance home"
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#10253f] text-sm font-bold text-white">
              IF
            </span>

            <span className="text-sm font-bold tracking-[-0.02em]">
              innovate finance
            </span>
          </a>

          <nav
            className="hidden items-center gap-8 text-sm font-medium text-[#5f7183] md:flex"
            aria-label="Main navigation"
          >
            <a
              href="#about"
              className="transition-colors hover:text-[#10253f]"
            >
              About the Powerlist
            </a>

            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#10253f]"
            >
              How it works
            </a>

            <a
              href="#faq"
              className="transition-colors hover:text-[#10253f]"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* DESKTOP AUTH BUTTON */}
            {!authChecked ? (
              <div
                className="hidden h-10 w-36 rounded-full bg-transparent md:block"
                aria-hidden="true"
              />
            ) : isLinkedInAuthenticated && !hasProfile ? (
              <button
                type="button"
                onClick={() => router.push("/?claim=true")}
                className="hidden rounded-full bg-[#1e63f1] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(30,99,241,0.2)] transition hover:bg-[#1555d5] md:block"
              >
                Claim Your Powerlist Profile
              </button>
            ) : isLinkedInAuthenticated && hasProfile ? (
              <div className="flex items-center gap-2">
                <a
                  href="/profile"
                  className="hidden rounded-full border border-[#dfe5eb] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm md:block"
                >
                  My Profile
                </a>

                <button
                  type="button"
                  onClick={walletAddress ? copyAddress : connectCoreWallet}
                  className="hidden items-center gap-2 rounded-full border border-[#dfe5eb] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm md:flex"
                  aria-label={
                    walletAddress
                      ? "Copy wallet address"
                      : "Connect Core Wallet"
                  }
                >
                  <span
                    className={`size-2 rounded-full ${
                      walletAddress ? "bg-[#45c87a]" : "bg-gray-400"
                    }`}
                  />

                  {walletAddress
                    ? isCopied
                      ? "Copied"
                      : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "Connect Core Wallet"}

                  {walletAddress &&
                    (isCopied ? (
                      <Check className="size-4 text-[#45c87a]" />
                    ) : (
                      <Copy className="size-4 text-[#8a9bab]" />
                    ))}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="hidden rounded-full bg-[#1e63f1] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(30,99,241,0.2)] transition hover:bg-[#1555d5] md:block"
              >
                Sign in with LinkedIn
              </button>
            )}

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-full border border-[#dfe5eb] bg-white p-2.5 md:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </header>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="absolute right-6 top-20 z-30 flex w-72 flex-col gap-4 rounded-2xl border border-[#dfe5eb] bg-white p-5 text-sm font-semibold shadow-xl md:hidden">
            <a
              href="#about"
              onClick={() => setIsMenuOpen(false)}
            >
              About the Powerlist
            </a>

            <a
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
            >
              How it works
            </a>

            <a
              href="#faq"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </a>

            <div className="border-t border-[#e5e9ee] pt-4">
              {!authChecked ? (
                <div className="h-10" />
              ) : isLinkedInAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <a
                    href="/profile"
                    className="rounded-full border border-[#dfe5eb] bg-white px-4 py-3 text-center text-sm font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (walletAddress) {
                        copyAddress();
                      } else {
                        connectCoreWallet();
                      }
                    }}
                    className="flex items-center justify-center gap-2 rounded-full border border-[#dfe5eb] bg-white px-4 py-3 text-sm font-semibold"
                  >
                    <span
                      className={`size-2 rounded-full ${
                        walletAddress ? "bg-[#45c87a]" : "bg-gray-400"
                      }`}
                    />

                    {walletAddress
                      ? isCopied
                        ? "Copied"
                        : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                      : "Connect Core Wallet"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogin();
                  }}
                  className="w-full rounded-full bg-[#1e63f1] px-5 py-3 text-sm font-bold text-white"
                >
                  Sign in with LinkedIn
                </button>
              )}
            </div>
          </div>
        )}

        {walletError && (
          <div
            role="alert"
            className="mx-auto max-w-[1280px] px-6 text-sm text-red-600 lg:px-10"
          >
            {walletError}
          </div>
        )}

        {/* HERO */}
        <HeroSection
          verifiedProfile={{ title: "Jane Doe" }}
          onClaimTicket={() => setIsSignInOpen(true)}
        />

        {/* ABOUT */}
        <section
          id="about"
          className="border-y border-[#e4e9ee] bg-white"
        >
          <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1e63f1]">
                A new kind of recognition
              </p>

              <h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-[-.05em]">
                One ticket.
                <br />
                A lasting signal.
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="border-t-2 border-[#dce9ff] pt-5"
                >
                  <p className="text-sm font-bold text-[#1e63f1]">
                    {step.number}
                  </p>

                  <h3 className="mt-8 text-base font-bold">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#718294]">
                    {step.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1e63f1]">
              Built for the community
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-.05em]">
              Your identity stays yours.
              Your ticket goes everywhere.
            </h2>
          </div>

          <div className="flex max-w-md items-center gap-4 rounded-2xl border border-[#dfe5eb] bg-white p-5">
            <BriefcaseBusiness className="size-7 shrink-0 text-[#0a66c2]" />

            <p className="text-sm leading-6 text-[#627487]">
              We use your LinkedIn profile only to verify your place in
              the Powerlist community.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          id="admin"
          className="border-t border-[#e4e9ee] bg-[#10253f] text-white"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
            <div>
              <p className="font-bold">innovate finance</p>

              <p className="mt-2 text-sm text-[#9baebe]">
                Women in FinTech Powerlist 2026
              </p>
            </div>

            <div className="flex gap-6 text-sm text-[#b7c4d0]">
              <a href="#about" className="hover:text-white">
                About
              </a>

              <a href="#how-it-works" className="hover:text-white">
                How it works
              </a>

              <a href="/login2" className="hover:text-white">
                Admin
              </a>
            </div>
          </div>
        </footer>

        {/* BADGE */}
        {badgeClaimed && verifiedProfile && (
          <section
            className="fixed bottom-6 right-6 z-40 w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-3xl border border-[#dfe5eb] bg-white shadow-2xl"
            aria-label="Your Powerlist badge"
          >
            <div className="h-2 bg-[#1e63f1]" />

            <div className="flex gap-4 p-5">
              <img
                src={verifiedProfile.featured_image || "/placeholder.jpg"}
                alt=""
                className="size-20 rounded-2xl object-cover"
              />

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#1e63f1]">
                  Badge created
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-[#10253f]">
                  {verifiedProfile.title}
                </h2>

                <p className="mt-1 text-xs text-[#718294]">
                  Women in FinTech Powerlist 2026
                </p>

                <p className="mt-3 inline-flex rounded-full bg-[#effcf4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#176b3a]">
                  Avalanche · 1 of 1
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SIGN-IN / RECIPIENT MODAL */}
        {isSignInOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-[#10253f]/45 p-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsSignInOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="signin-title"
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsSignInOpen(false)}
                className="absolute right-5 top-5 rounded-full p-2 text-[#8a9bab] hover:bg-[#f2f5f8]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              {/* 1. Loading state */}
              {isLoadingRecipients ? (
                <div className="py-8 text-center">
                  <div
                    className="mx-auto size-10 animate-spin rounded-full border-4 border-[#dce9ff] border-t-[#1e63f1]"
                    aria-label="Loading"
                  />

                  <h2
                    id="signin-title"
                    className="mt-6 text-2xl font-semibold tracking-[-.05em]"
                  >
                    Checking your profile...
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#718294]">
                    Please wait while we check your Powerlist eligibility.
                  </p>
                </div>
              ) : recipientError ? (
                /* 2. Error state */
                <div className="py-4">
                  <h2
                    id="signin-title"
                    className="mt-4 text-2xl font-semibold tracking-[-.05em]"
                  >
                    Unable to check your profile
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#718294]">
                    {recipientError}
                  </p>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-7 w-full rounded-full bg-[#0a66c2] px-5 py-4 text-sm font-bold text-white hover:bg-[#084f96]"
                  >
                    Try again
                  </button>
                </div>
              ) : !hasProfile ? (
                /* 3. LinkedIn sign-in */
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#eaf3ff] text-[#0a66c2]">
                    <BriefcaseBusiness className="size-7" />
                  </div>

                  <h2
                    id="signin-title"
                    className="mt-7 text-3xl font-semibold tracking-[-.05em]"
                  >
                    Sign in with LinkedIn
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#718294]">
                    Sign in with LinkedIn to verify your Powerlist profile.
                  </p>

                  <button
                    type="button"
                    onClick={handleLogin}
                    className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#0a66c2] px-5 py-4 text-sm font-bold text-white hover:bg-[#084f96]"
                  >
                    <BriefcaseBusiness className="size-5" />
                    Continue with LinkedIn
                  </button>
                </>
              ) : !hasSelectedRecipients ? (
                /* 4. Profile exists but is not selected */
                <>
                  <h2
                    id="signin-title"
                    className="mt-4 text-3xl font-semibold tracking-[-.05em]"
                  >
                    Sorry, you didn't make the list
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#718294]">
                    Unfortunately, your profile isn't among the selected
                    recipients for this Powerlist. Thanks for checking!
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsSignInOpen(false)}
                    className="mt-7 w-full rounded-full bg-[#0a66c2] px-5 py-4 text-sm font-bold text-white hover:bg-[#084f96]"
                  >
                    Close
                  </button>
                </>
              ) : (
                /* 5. Matched recipients */
                <>
                  <h2
                    id="signin-title"
                    className="mt-4 text-3xl font-semibold tracking-[-.05em]"
                  >
                    Congratulations!
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#718294]">
                    You've made the list! Here's your NFT.
                  </p>

                  <div className="mt-6 space-y-4">
                    {matchedRecipients.map((recipient) => (
                      <article
                        key={recipient._id}
                        className="rounded-2xl border border-[#dfe5eb] bg-white p-4"
                      >
                        <div className="flex items-center gap-4">
                          {recipient.imageUrl ? (
                            <img
                              src={recipient.imageUrl}
                              alt={recipient.name}
                              className="size-20 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-[#eaf3ff] text-[#0a66c2]">
                              <BriefcaseBusiness className="size-7" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="font-bold text-[#10253f]">
                              {recipient.name}
                            </h3>

                            {recipient.jobTitle && (
                              <p className="mt-1 text-sm leading-5 text-[#718294]">
                                {recipient.jobTitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleMakeTicket(recipient)}
                          className="mt-4 w-full rounded-full bg-[#1e63f1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1555d5]"
                        >
                          Make Ticket
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <ClaimOverlay />
    </>
  );
}
