/**
 * Redirect helpers for the auth routes. Every auth response is no-store, and the locale in
 * a redirect is always one we actually offer, so a crafted `lang` cannot open a redirect
 * to another site or an unknown path.
 */
import { isRoutableLocale } from "../i18n.ts";

export function safeLang(value: string | null): string {
  return value && isRoutableLocale(value) ? value : "en";
}

export type AuthNotice =
  | "signed-in"
  | "signed-out"
  | "deleted"
  | "unavailable"
  | "age"
  | "provider"
  | "failed"
  | "confirm"
  | "delete-unavailable"
  | "age-not-recorded";

export function meUrl(lang: string, notice?: AuthNotice): string {
  return `/${lang}/me${notice ? `?auth=${notice}` : ""}`;
}

export function redirectWith(location: string, setCookies: string[]): Response {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const cookie of setCookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}
