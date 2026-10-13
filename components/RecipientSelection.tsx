
"use client";

import { useEffect, useState } from "react";

type RecipientSelectionProps = {
  profileId: string;
  name: string;
  jobTitle?: string;
  category?: string;
  imageUrl?: string;
  companyLogo?: string;
  linkedinUrl?: string;
  wallet?: string;
  tokenId?: string;
  year?: number;
  ticketConfig?: Record<string, unknown>;
};

export default function RecipientSelection({
  profileId,
  name,
  jobTitle = "",
  category = "",
  imageUrl = "",
  companyLogo = "",
  linkedinUrl = "",
  wallet = "",
  tokenId = "",
  year = 2026,
  ticketConfig = {},
}: RecipientSelectionProps) {
  const [recipientSelected, setRecipientSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSelection() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/nft-selections?year=${year}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not load selection.");
        }

        const existing = data.selections?.find(
          (selection: { profileId: string }) =>
            selection.profileId === profileId
        );

        if (!cancelled) {
          setRecipientSelected(
            existing?.recipientSelected ?? false
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load selection."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSelection();

    return () => {
      cancelled = true;
    };
  }, [profileId, year]);

  async function saveSelection(checked: boolean) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/nft-selections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          name,
          jobTitle,
          category,
          imageUrl,
          companyLogo,
          linkedinUrl,
          wallet,
          tokenId,
          year,
          ticketConfig,
          recipientSelected: checked,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not save selection.");
      }

      setRecipientSelected(checked);
      setNotice(
        checked
          ? "Recipient selection saved."
          : "Recipient selection cleared."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save selection."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={recipientSelected}
          disabled={loading || saving}
          onChange={(event) => {
            void saveSelection(event.target.checked);
          }}
          className="mt-1 h-4 w-4"
        />

        <span>
          <span className="block font-medium">
            Recipient selected
          </span>

          <span className="mt-1 block text-sm text-gray-500">
            Selection only — no NFTs have been minted.
          </span>
        </span>
      </label>

      {loading && (
        <p className="text-sm text-gray-500">
          Loading selection...
        </p>
      )}

      {saving && (
        <p className="text-sm text-gray-500">
          Saving...
        </p>
      )}

      {notice && (
        <p role="status" className="text-sm text-green-600">
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
