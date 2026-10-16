
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TimerRedirectProps = {
  seconds?: number;
  redirectTo?: string;
};

export default function TimerRedirect({
  seconds = 5,
  redirectTo = "/requestform",
}: TimerRedirectProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace(redirectTo);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router, redirectTo]);

  return (
    <p>
      Redirecting in {countdown} seconds...
    </p>
  );
}
