import { authClient } from "@/lib/auth/client";

/**
 * Checks whether a given JWT token is expired or close to expiring (within bufferSeconds).
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return true;

    // Compare with current Unix time (in seconds)
    const currentUnix = Math.floor(Date.now() / 1000);
    return currentUnix >= payload.exp - bufferSeconds;
  } catch {
    return true;
  }
}

/**
 * Returns a valid, non-expired JWT token.
 * Proactively refreshes the token using Neon Auth (Better Auth) if it is missing or expired.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  let token = localStorage.getItem("authToken");

  // If token is missing or expired, fetch a fresh token from Neon Auth
  if (!token || isTokenExpired(token)) {
    try {
      const { data } = await authClient.token();
      if (data?.token) {
        token = data.token;
        localStorage.setItem("authToken", token);
      } else {
        localStorage.removeItem("authToken");
        return null;
      }
    } catch (err) {
      localStorage.removeItem("authToken");
      return null;
    }
  }

  return token;
}

/**
 * Wrapper around standard fetch that automatically attaches the Bearer token,
 * ensures it's fresh before sending, and retries once if a 401 is encountered.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let token = await getAuthToken();

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
  });

  // If response is 401 Unauthorized, try forcing a fresh token once and retry
  if (response.status === 401 && typeof window !== "undefined") {
    try {
      const { data } = await authClient.token();
      if (data?.token) {
        token = data.token;
        localStorage.setItem("authToken", token);
        headers.set("Authorization", `Bearer ${token}`);
        response = await fetch(input, {
          ...init,
          headers,
        });
      }
    } catch {
      // Refresh failed; keep the original 401 response
    }
  }

  return response;
}
