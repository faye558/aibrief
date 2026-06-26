import { GoogleAuth } from "google-auth-library";

let auth: GoogleAuth | null = null;

export function getGoogleAuth() {
  if (auth) return auth;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다");
  const credentials = JSON.parse(key);
  auth = new GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ],
  });
  return auth;
}

export async function getAccessToken() {
  const client = await getGoogleAuth().getClient();
  const tokenResponse = await (client as any).getAccessToken();
  return tokenResponse.token as string;
}
