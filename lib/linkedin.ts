export function normalizeLinkedInUrl(url?: string | null): string | null {
    if (!url) return null;
    try {
      const cleaned = url.trim().toLowerCase().replace(/\/+$/, "");
      const match = cleaned.match(/linkedin\.com\/in\/([a-z0-9\-_%.]+)/i);
      return match ? `https://www.linkedin.com/in/${match[1]}` : null;
    } catch {
      return null;
    }
  }
  
  export function extractLinkedInVanity(url?: string | null): string | null {
    const normalized = normalizeLinkedInUrl(url);
    if (!normalized) return null;
    return normalized.split("/in/")[1] || null;
  }