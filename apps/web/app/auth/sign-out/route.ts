/** POST /auth/sign-out — forgets the session cookie on this browser. */
import { COOKIE, clearCookie } from "../../../lib/auth/cookies.ts";
import { meUrl, redirectWith, safeLang } from "../../../lib/auth/redirect.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const lang = safeLang(typeof form.get("lang") === "string" ? (form.get("lang") as string) : null);
  const secure = new URL(request.url).protocol === "https:";
  return redirectWith(meUrl(lang, "signed-out"), [clearCookie(COOKIE.access, secure)]);
}
