import { GoogleAuth } from "google-auth-library";

let auth: GoogleAuth | null = null;

export function getGoogleAuth() {
  if (auth) return auth;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY 없음");
  auth = new GoogleAuth({
    credentials: JSON.parse(key),
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ],
  });
  return auth;
}

export async function getAccessToken() {
  const client = await getGoogleAuth().getClient();
  const res = await (client as any).getAccessToken();
  return res.token as string;
}
