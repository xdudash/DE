/**
 * Interface localization: catalogs plus a translator factory.
 * Decision and scope: docs/architecture/decisions/ADR-0009-ui-i18n.md.
 * Policy (waves, availability, review states): docs/domain/LOCALIZATION_POLICY.md.
 */
import { formatMessage, type Values } from "./format.ts";
import { en, type Catalog, type MessageKey } from "./catalogs/en.ts";
import { ru } from "./catalogs/ru.ts";
import { uk } from "./catalogs/uk.ts";
import { ar } from "./catalogs/ar.ts";

export * from "./format.ts";
export type { Catalog, MessageKey } from "./catalogs/en.ts";

export const PIVOT_LOCALE = "en";

export interface LocaleInfo {
  code: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  /** True while the locale exists only to exercise the layout (not offered to learners). */
  preview: boolean;
}

export const LOCALES: readonly LocaleInfo[] = [
  { code: "en", nativeName: "English", dir: "ltr", preview: false },
  { code: "uk", nativeName: "Українська", dir: "ltr", preview: false },
  { code: "ru", nativeName: "Русский", dir: "ltr", preview: false },
  { code: "ar", nativeName: "العربية", dir: "rtl", preview: true },
];

const CATALOGS: Record<string, Catalog> = { en, uk, ru, ar };

export function catalogs(): Record<string, Catalog> {
  return CATALOGS;
}

export function localeInfo(locale: string): LocaleInfo {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0]!;
}

/** Locales a learner may pick; preview locales are reachable only by direct URL. */
export function offeredLocales(): LocaleInfo[] {
  return LOCALES.filter((l) => !l.preview);
}

export function isPreviewLocale(locale: string): boolean {
  return localeInfo(locale).preview;
}

export type Translate = (key: MessageKey, values?: Values) => string;

/**
 * Builds a translator for one locale. A missing key falls back to the pivot catalog
 * rather than printing the key, and an unknown locale falls back entirely — so a
 * half-translated catalog degrades into readable English instead of raw identifiers.
 */
export function translator(locale: string): Translate {
  const catalog = CATALOGS[locale] ?? CATALOGS[PIVOT_LOCALE]!;
  const pivot = CATALOGS[PIVOT_LOCALE]!;
  return (key, values) => {
    const message = catalog[key] ?? pivot[key];
    if (message === undefined) throw new Error(`unknown message key "${key}"`);
    const usedPivot = catalog[key] === undefined;
    return formatMessage(message, values, usedPivot ? PIVOT_LOCALE : locale);
  };
}
