"use client";

interface LinkedInLoginButtonProps {
  text?: string;
  className?: string;
  disabled?: boolean;
}

export default function LinkedInLoginButton({
  text = "Continue with LinkedIn",
  className = "",
  disabled = false,
}: LinkedInLoginButtonProps) {
  function handleLogin() {
    window.location.href = "/api/linkedin/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-3 rounded-lg bg-[#0A66C2] px-6 py-3 font-semibold text-white transition hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.28 2.37 4.28 5.46v6.28zM5.32 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM3.54 9h3.56v11.45H3.54V9z" />
      </svg>

      <span>{text}</span>
    </button>
  );
}