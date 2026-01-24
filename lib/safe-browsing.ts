type SafeBrowsingMatch = {
  threatType?: string;
  platformType?: string;
  threatEntryType?: string;
};

export type UrlSafetyResult =
  | { safe: true; reason: string }
  | { safe: false; reason: string; matches: SafeBrowsingMatch[] };

export async function checkUrlSafety(url: string): Promise<UrlSafetyResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return { safe: true, reason: "Safe Browsing not configured" };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(
    apiKey
  )}`;

  const body = {
    client: {
      clientId: "simple-qr",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Safe Browsing API error:", response.status, text);
      return { safe: true, reason: "Safe Browsing API error (fail open)" };
    }

    const data = (await response.json().catch(() => ({}))) as {
      matches?: SafeBrowsingMatch[];
    };

    if (Array.isArray(data.matches) && data.matches.length > 0) {
      return {
        safe: false,
        reason: "URL flagged as unsafe by Google Safe Browsing",
        matches: data.matches,
      };
    }

    return { safe: true, reason: "No Safe Browsing matches" };
  } catch (error) {
    console.error("Safe Browsing request failed:", error);
    return { safe: true, reason: "Safe Browsing request failed (fail open)" };
  }
}
