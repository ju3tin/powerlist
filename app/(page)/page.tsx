
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  BriefcaseBusiness,
  Check,
  Copy,
  Menu,
  X,
  Download,
  Ticket,
  LoaderCircle,
} from "lucide-react";

import HeroSection from "@/components/hero1";
import PageStyle from "./PageStyle";
import ClaimOverlay from "@/app/components/ClaimOverlay";

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
  year?: number;
  profileId: string;
  recipientSelected: boolean;
  status?: string;
  name: string;
  jobTitle?: string;
  imageUrl?: string;
  category?: string;
  tokenId?: string;
  linkedinUrl?: string;
  companyLogo?: string;
}

interface LinkedInProfile {
  id?: number;
  title: string;
  slug?: string;
  profileId: string;
  artist_title?: string;
  featured_image?: string;
  power_list_category?: string;
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
    text: "Preview your unique Powerlist 2026 ticket.",
  },
  {
    number: "03",
    title: "Keep it forever",
    text: "Download your ticket and keep it ready for the celebration.",
  },
];

export default function Page() {
  const router = useRouter();

  // LinkedIn authentication
  const [isLinkedInAuthenticated, setIsLinkedInAuthenticated] =
    useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [verifiedProfile, setVerifiedProfile] =
    useState<LinkedInProfile | null>(null);

  // Core Wallet
  const [walletAddress, setWalletAddress] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [walletError, setWalletError] = useState("");

  // Page and recipient state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [matchedRecipients, setMatchedRecipients] =
    useState<NFTSelection[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  const [recipientError, setRecipientError] = useState("");

  // Ticket preview
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState("");

  // Existing verification/badge state
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [verificationState, setVerificationState] = useState<
    "idle" | "loading" | "eligible" | "not-found" | "error"
  >("idle");

  const [badgeClaimed, setBadgeClaimed] = useState(false);

  // LinkedIn sign-in
  const handleLogin = () => {
    window.location.href = "/api/linkedin/login";
  };

  // Check LinkedIn session and profile
  useEffect(() => {
    let cancelled = false;

    async function checkLinkedInSession() {
      try {
        const response = await fetch("/api/linkedin/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (cancelled) return;

        const authenticated =
          response.ok && data.authenticated === true;

        const profileExists =
          authenticated &&
          data.hasProfile === true &&
          Boolean(data.profile?.profileId);

        setIsLinkedInAuthenticated(authenticated);
        setHasProfile(profileExists);
        setVerifiedProfile(profileExists ? data.profile : null);
      } catch (error) {
        console.error("LinkedIn authentication check failed:", error);

        if (!cancelled) {
          setIsLinkedInAuthenticated(false);
          setHasProfile(false);
          setVerifiedProfile(null);
        }
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
        }
      }
    }

    void checkLinkedInSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load recipients selected for the signed-in LinkedIn profile
  useEffect(() => {
    let cancelled = false;

    async function loadRecipients() {
      setIsLoadingRecipients(true);
      setRecipientError("");

      try {
        const profileResponse = await fetch(
          "/api/linkedin/profile",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!profileResponse.ok) {
          throw new Error("Unable to check your LinkedIn profile.");
        }

        const profileData = await profileResponse.json();
        const profileId: string | undefined =
          profileData.profile?.profileId;

        if (
          profileData.authenticated !== true ||
          profileData.hasProfile !== true ||
          !profileId
        ) {
          if (!cancelled) {
            setMatchedRecipients([]);
          }
          return;
        }

        const selectionsResponse = await fetch(
          "/api/nft-selections",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!selectionsResponse.ok) {
          throw new Error("Unable to load Powerlist selections.");
        }

        const selectionsData = await selectionsResponse.json();

        const selections: NFTSelection[] = Array.isArray(
          selectionsData.selections
        )
          ? selectionsData.selections
          : selectionsData.selections
            ? [selectionsData.selections]
            : [];

        const recipients = selections.filter(
          (selection) =>
            selection.profileId === profileId &&
            selection.recipientSelected === true
        );

        if (!cancelled) {
          setMatchedRecipients(recipients);
        }
      } catch (error) {
        console.error("Error loading selected recipients:", error);

        if (!cancelled) {
          setMatchedRecipients([]);
          setRecipientError(
            error instanceof Error
              ? error.message
              : "Unable to load your selected recipient."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRecipients(false);
        }
      }
    }

    void loadRecipients();

    return () => {
      cancelled = true;
    };
  }, []);

  // Connect Core Wallet
  const connectCoreWallet = async () => {
    setWalletError("");

    try {
      const provider = window.avalanche;

      if (!provider) {
        window.open("https://core.app/", "_blank", "noopener,noreferrer");

        setWalletError(
          "Core Wallet was not detected. Install the Core browser extension and try again."
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

  // Restore Core Wallet connection
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
        setWalletAddress((accounts as string[])?.[0] ?? "");
      })
      .catch(() => {});

    return () => {
      provider.removeListener?.("accountsChanged", handleAccounts);
    };
  }, []);

  // Copy wallet address
  const copyAddress = async () => {
    if (!walletAddress) {
      await connectCoreWallet();
      return;
    }

    try {
      await navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);

      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setWalletError("Unable to copy wallet address.");
    }
  };

  // Generate the PNG ticket using your existing API
  const handleMakeTicket = async (recipient: NFTSelection) => {
    setIsCreatingTicket(true);
    setTicketError("");

    setTicketPreview((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return null;
    });

    try {
      const response = await fetch("/api/preview-ticket", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: recipient.name,
          tokenId: recipient.tokenId ?? recipient._id,
          imageUrl: recipient.imageUrl ?? "",
          role: recipient.jobTitle ?? "",
          category:
            recipient.category ??
            verifiedProfile?.power_list_category ??
            "",
          year: String(recipient.year ?? 2026),
          companyLogo: recipient.companyLogo ?? "",
          linkedinUrl: recipient.linkedinUrl ?? "",
        }),
      });

      if (!response.ok) {
        let message = "Failed to generate the ticket preview.";

        try {
          const errorData = await response.json();
          message =
            errorData.error ||
            errorData.message ||
            message;
        } catch {
          // The server may return a non-JSON error.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob.type.includes("image/png")) {
        throw new Error("The preview API did not return a PNG image.");
      }

      const imageUrl = URL.createObjectURL(blob);
      setTicketPreview(imageUrl);
    } catch (error) {
      console.error("Ticket preview error:", error);

      setTicketError(
        error instanceof Error
          ? error.message
          : "Something went wrong generating your ticket."
      );
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Release the image URL when it changes or the page unmounts
  useEffect(() => {
    return () => {
      if (ticketPreview) {
        URL.revokeObjectURL(ticketPreview);
      }
    };
  }, [ticketPreview]);

  // Existing Powerlist profile verification
  async function verifyProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerificationState("loading");

    try {
      const response = await fetch(
        `/api/powerlist?linkedin=${encodeURIComponent(linkedinUrl)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Profile verification failed.");
      }

      setVerifiedProfile(result.profile ?? null);
      setBadgeClaimed(Boolean(result.eligible));
      setVerificationState(
        result.eligible ? "eligible" : "not-found"
      );
    } catch {
      setVerificationState("error");
    }
  }

  const openClaimModal = () => {
    setTicketError("");
    setTicketPreview(null);
    setIsSignInOpen(true);
  };

  const selectedRecipient = matchedRecipients[0];

  return (
    <>
      <PageStyle />

      <main
        id="top"
        className="min-h-screen overflow-hidden bg-[#f7f8fa] text-[#10253f]"
      >
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
            <a href="#about" className="transition-colors hover:text-[#10253f]">
              About the Powerlist
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#10253f]"
            >
              How it works
            </a>
            <a href="#faq" className="transition-colors hover:text-[#10253f]">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!authChecked ? (
              <div className="hidden h-10 w-36 md:block" />
            ) : isLinkedInAuthenticated && !hasProfile ? (
              <button
                type="button"
                onClick={() => router.push("/?claim=true")}
                className="hidden rounded-full bg-[#1e63f1] px-5 py-2.5 text-sm font-bold text-white md:block"
              >
                Claim Your Powerlist Profile
              </button>
            ) : isLinkedInAuthenticated ? (
              <div className="flex items-center gap-2">
                <a
                  href="/profile"
                  className="hidden rounded-full border border-[#dfe5eb] bg-white px-4 py-2.5 text-sm font-semibold md:block"
                >
                  My Profile
                </a>
                <button
                  type="button"
                  onClick={walletAddress ? copyAddress : connectCoreWallet}
                  className="hidden items-center gap-2 rounded-full border border-[#dfe5eb] bg-white px-4 py-2.5 text-sm font-semibold md:flex"
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
                className="hidden rounded-full bg-[#1e63f1] px-5 py-2.5 text-sm font-bold text-white md:block"
              >
                Sign in with LinkedIn
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="rounded-full border border-[#dfe5eb] bg-white p-2.5 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
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
            <a href="#about" onClick={() => setIsMenuOpen(false)}>
              About the Powerlist
            </a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>
              How it works
            </a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>
              FAQ
            </a>

            <div className="border-t border-[#e5e9ee] pt-4">
              {isLinkedInAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <a
                    href="/profile"
                    className="rounded-full border border-[#dfe5eb] px-4 py-3 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      void (walletAddress ? copyAddress() : connectCoreWallet());
                    }}
                    className="rounded-full border border-[#dfe5eb] px-4 py-3"
                  >
                    {walletAddress
                      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
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

        {/* HERO */}
        <HeroSection
          verifiedProfile={{ title: verifiedProfile?.title ?? "Jane Doe" }}
          onClaimTicket={openClaimModal}
        />

        {/* ABOUT */}
        <section id="about" className="border-y border-[#e4e9ee] bg-white">
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
                  <h3 className="mt-8 text-base font-bold">{step.title}</h3>
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
              <br />
              Your ticket goes everywhere.
            </h2>
          </div>

          <div className="flex max-w-md items-center gap-4 rounded-2xl border border-[#dfe5eb] bg-white p-5">
            <BriefcaseBusiness className="size-7 shrink-0 text-[#0a66c2]" />
            <p className="text-sm leading-6 text-[#627487]">
              We use your LinkedIn profile only to verify your place in the
              Powerlist community.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-[#e4e9ee] bg-white">
          <div className="mx-auto max-w-[900px] px-6 py-16 lg:py-20">
            <h2 className="text-3xl font-semibold tracking-[-.04em]">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="font-bold">How do I get my ticket?</h3>
                <p className="mt-2 text-sm leading-6 text-[#718294]">
                  Sign in with LinkedIn. If your profile is selected, generate
                  a preview and download your ticket.
                </p>
              </div>
              <div>
                <h3 className="font-bold">Can I download the ticket?</h3>
                <p className="mt-2 text-sm leading-6 text-[#718294]">
                  Yes. Once the preview is generated, use the download button
                  on the Congratulations screen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#e4e9ee] bg-[#10253f] text-white">
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

        {/* EXISTING PROFILE BADGE */}
        {badgeClaimed && verifiedProfile && (
          <section
            className="fixed bottom-6 right-6 z-40 w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-3xl border border-[#dfe5eb] bg-white shadow-2xl"
            aria-label="Your Powerlist badge"
          >
            <div className="h-2 bg-[#1e63f1]" />
            <div className="flex gap-4 p-5">
              {verifiedProfile.featured_image && (
                <img
                  src={verifiedProfile.featured_image}
                  alt=""
                  className="size-20 rounded-2xl object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#1e63f1]">
                  Badge created
                </p>
                <h2 className="mt-1 truncate text-lg font-bold">
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

        {/* CONGRATULATIONS / TICKET MODAL */}
        {isSignInOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#10253f]/60 p-4 backdrop-blur-sm sm:p-6"
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
              className="relative my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsSignInOpen(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-[#8a9bab] hover:bg-[#f2f5f8]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              {!isLinkedInAuthenticated || !hasProfile ? (
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#eaf3ff] text-[#0a66c2]">
                    <BriefcaseBusiness className="size-7" />
                  </div>
                  <h2
                    id="signin-title"
                    className="mt-6 text-3xl font-semibold tracking-[-.05em]"
                  >
                    Sign in with LinkedIn
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#718294]">
                    Sign in to verify your Powerlist profile and check whether
                    you have been selected.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#0a66c2] px-5 py-4 text-sm font-bold text-white hover:bg-[#084f96]"
                  >
                    Continue with LinkedIn
                  </button>
                </>
              ) : isLoadingRecipients ? (
                <>
                  <LoaderCircle className="size-10 animate-spin text-[#1e63f1]" />
                  <h2
                    id="signin-title"
                    className="mt-5 text-2xl font-semibold"
                  >
                    Checking your Powerlist selection…
                  </h2>
                  <p className="mt-2 text-sm text-[#718294]">
                    Please wait while we check your profile.
                  </p>
                </>
              ) : recipientError ? (
                <>
                  <h2
                    id="signin-title"
                    className="text-2xl font-semibold"
                  >
                    We couldn't check your selection
                  </h2>
                  <p role="alert" className="mt-3 text-sm text-red-600">
                    {recipientError}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-6 rounded-full bg-[#1e63f1] px-5 py-3 text-sm font-bold text-white"
                  >
                    Try again
                  </button>
                </>
              ) : matchedRecipients.length === 0 ? (
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#f2f5f8] text-[#718294]">
                    <BriefcaseBusiness className="size-7" />
                  </div>
                  <h2
                    id="signin-title"
                    className="mt-6 text-3xl font-semibold tracking-[-.05em]"
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
              ) : ticketPreview ? (
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#effcf4] text-[#176b3a]">
                    <Check className="size-7" />
                  </div>

                  <h2
                    id="signin-title"
                    className="mt-5 text-3xl font-semibold tracking-[-.05em]"
                  >
                    Congratulations!
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#718294]">
                    You've made the list! Your Powerlist ticket preview is
                    ready.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-[#e4e9ee] bg-[#f7f8fa] p-2 sm:p-4">
                    <img
                      src={ticketPreview}
                      alt={`Powerlist ticket for ${selectedRecipient?.name ?? "recipient"}`}
                      className="mx-auto block h-auto w-full rounded-xl"
                    />
                  </div>

                  <a
                    href={ticketPreview}
                    download={`powerlist-ticket-${(selectedRecipient?.name ?? "ticket")
                      .trim()
                      .replace(/[^a-z0-9]+/gi, "-")
                      .toLowerCase()}.png`}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#1e63f1] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#1555d5]"
                  >
                    <Download className="size-5" />
                    Download Ticket
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (ticketPreview) {
                        URL.revokeObjectURL(ticketPreview);
                      }
                      setTicketPreview(null);
                      setTicketError("");
                    }}
                    className="mt-3 w-full rounded-full border border-[#dfe5eb] px-5 py-3 text-sm font-semibold hover:bg-[#f7f8fa]"
                  >
                    Generate Preview Again
                  </button>
                </>
              ) : (
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#effcf4] text-[#176b3a]">
                    <Ticket className="size-7" />
                  </div>

                  <h2
                    id="signin-title"
                    className="mt-5 text-3xl font-semibold tracking-[-.05em]"
                  >
                    Congratulations!
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#718294]">
                    You've made the list! Generate your Powerlist ticket
                    preview below.
                  </p>

                  {matchedRecipients.map((recipient) => (
                    <div
                      key={recipient._id}
                      className="mt-6 flex items-center gap-4 rounded-2xl border border-[#e4e9ee] bg-[#f7f8fa] p-4"
                    >
                      {recipient.imageUrl ? (
                        <img
                          src={recipient.imageUrl}
                          alt=""
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-white">
                          <BriefcaseBusiness className="size-7 text-[#8a9bab]" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-bold">{recipient.name}</p>
                        {recipient.jobTitle && (
                          <p className="mt-1 text-sm text-[#718294]">
                            {recipient.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {ticketError && (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {ticketError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRecipient) {
                        void handleMakeTicket(selectedRecipient);
                      }
                    }}
                    disabled={isCreatingTicket || !selectedRecipient}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#1e63f1] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#1555d5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingTicket ? (
                      <>
                        <LoaderCircle className="size-5 animate-spin" />
                        Generating ticket preview…
                      </>
                    ) : (
                      <>
                        <Ticket className="size-5" />
                        Generate Ticket Preview
                      </>
                    )}
                  </button>
                </>
              )}

              {walletError && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {walletError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* EXISTING CLAIM OVERLAY */}
        <ClaimOverlay />
      </main>
    </>
  );
}
