/**
 * Interface localization for the app. Content explanations come from
 * `lib/content.ts`; these are the UI strings only (ADR-0009).
 *
 * A locale is routable when it is either offered to learners or a preview locale
 * (Arabic, for RTL verification). Preview locales are reachable by URL but never
 * appear in the language picker.
 */
import { localeInfo, offeredLocales, translator, type LocaleInfo, type Translate } from "@deutschgo/i18n";

export type { Translate } from "@deutschgo/i18n";
export { localeInfo, offeredLocales } from "@deutschgo/i18n";

/** Locales the router generates pages for: offered ones plus previews. */
export function routableLocales(): LocaleInfo[] {
  return [...offeredLocales(), ...PREVIEW_LOCALES];
}

const PREVIEW_LOCALES: LocaleInfo[] = [localeInfo("ar")];

export function isRoutableLocale(code: string): boolean {
  return routableLocales().some((l) => l.code === code);
}

export function ui(locale: string): Translate {
  return translator(locale);
}

/**
 * The explanation language used for content. Preview locales have no reviewed
 * explanations, so their pages show content in the pivot language with the usual
 * fallback notice rather than pretending a translation exists.
 */
export function contentLanguageFor(locale: string): string {
  return localeInfo(locale).preview ? "en" : locale;
}
