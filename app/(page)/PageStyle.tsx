"use client";

import { useEffect } from "react";

export default function PageStyle() {
  useEffect(() => {
    // Find the main element
    const main = document.querySelector("main");

    if (main) {
      // Remove the classes when the page opens
      main.classList.remove(
        "min-h-screen",
        "overflow-hidden",
        "bg-[#f7f8fa]"
      );

      // Keep the text color
      main.classList.add("text-[#10253f]");
    }

    // Change body background
    document.body.style.backgroundColor = "white";

    return () => {
      // Optional cleanup when leaving the page
      document.body.style.backgroundColor = "";
    };
  }, []);

  return null;
}
