/**
 * Minimal ICU-subset message formatter: interpolation, `plural` and `select`.
 * Decision and scope: docs/architecture/decisions/ADR-0009-ui-i18n.md.
 *
 * Supported:
 *   "Hello, {name}!"
 *   "{count, plural, one {# unit} other {# units}}"          (# = the number, localised)
 *   "{count, plural, =0 {nothing} one {# item} other {# items}}"
 *   "{gender, select, female {her} male {his} other {their}}"
 *   "{n, number}"                                            (locale-aware digits/grouping)
 * Nesting inside plural/select arms is supported; escaping with '{' is not needed
 * because the catalogs are ours — a stray brace raises at format time, and the test
 * suite formats every message of every catalog, so a typo cannot ship.
 *
 * Plural categories come from Intl.PluralRules, so Slavic one/few/many work without
 * a rule table of our own.
 */

export type Values = Record<string, string | number | boolean | null | undefined>;

export class MessageError extends Error {}

interface Arm {
  key: string;
  body: string;
}

/** Splits "one {a} other {b}" into arms, respecting nested braces. */
function parseArms(src: string, message: string): Arm[] {
  const arms: Arm[] = [];
  let i = 0;
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i]!)) i++;
    if (i >= src.length) break;
    const keyStart = i;
    while (i < src.length && !/\s|\{/.test(src[i]!)) i++;
    const key = src.slice(keyStart, i);
    while (i < src.length && /\s/.test(src[i]!)) i++;
    if (src[i] !== "{") throw new MessageError(`expected "{" after "${key}" in: ${message}`);
    const bodyStart = ++i;
    let depth = 1;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      if (depth > 0) i++;
    }
    if (depth !== 0) throw new MessageError(`unbalanced braces in arm "${key}" of: ${message}`);
    arms.push({ key, body: src.slice(bodyStart, i) });
    i++;
  }
  if (arms.length === 0) throw new MessageError(`no arms in: ${message}`);
  return arms;
}

/** Finds the matching "}" for the "{" at `open`. */
function matchBrace(message: string, open: number): number {
  let depth = 0;
  for (let i = open; i < message.length; i++) {
    if (message[i] === "{") depth++;
    else if (message[i] === "}" && --depth === 0) return i;
  }
  throw new MessageError(`unbalanced braces in: ${message}`);
}

function num(locale: string, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

function asNumber(name: string, raw: unknown, message: string): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) throw new MessageError(`"${name}" must be a number in: ${message}`);
  return n;
}

export function formatMessage(message: string, values: Values = {}, locale = "en"): string {
  let out = "";
  let i = 0;
  while (i < message.length) {
    const open = message.indexOf("{", i);
    if (open === -1) {
      out += message.slice(i);
      break;
    }
    out += message.slice(i, open);
    const close = matchBrace(message, open);
    const inner = message.slice(open + 1, close);
    const [rawName, kind, rest] = ((): [string, string?, string?] => {
      const first = inner.indexOf(",");
      if (first === -1) return [inner.trim()];
      const second = inner.indexOf(",", first + 1);
      if (second === -1) return [inner.slice(0, first).trim(), inner.slice(first + 1).trim()];
      return [inner.slice(0, first).trim(), inner.slice(first + 1, second).trim(), inner.slice(second + 1)];
    })();

    if (!(rawName in values)) throw new MessageError(`missing value "${rawName}" for: ${message}`);
    const value = values[rawName];

    if (kind === undefined) {
      out += value === null || value === undefined ? "" : String(value);
    } else if (kind === "number") {
      out += num(locale, asNumber(rawName, value, message));
    } else if (kind === "plural" || kind === "select") {
      if (rest === undefined) throw new MessageError(`"${rawName}, ${kind}" needs arms in: ${message}`);
      const arms = parseArms(rest, message);
      let chosen: Arm | undefined;
      if (kind === "plural") {
        const n = asNumber(rawName, value, message);
        const category = new Intl.PluralRules(locale).select(n);
        chosen = arms.find((a) => a.key === `=${n}`) ?? arms.find((a) => a.key === category) ?? arms.find((a) => a.key === "other");
        if (!chosen) throw new MessageError(`no plural arm for ${n} (${category}) in: ${message}`);
        out += formatMessage(chosen.body.replaceAll("#", num(locale, n)), values, locale);
      } else {
        const key = String(value);
        chosen = arms.find((a) => a.key === key) ?? arms.find((a) => a.key === "other");
        if (!chosen) throw new MessageError(`no select arm for "${key}" in: ${message}`);
        out += formatMessage(chosen.body, values, locale);
      }
    } else {
      throw new MessageError(`unsupported argument type "${kind}" in: ${message}`);
    }
    i = close + 1;
  }
  return out;
}

/** Every placeholder name a message needs, for catalog completeness checks. */
export function placeholders(message: string, into: Set<string> = new Set()): Set<string> {
  let i = 0;
  while (i < message.length) {
    const open = message.indexOf("{", i);
    if (open === -1) break;
    const close = matchBrace(message, open);
    const inner = message.slice(open + 1, close);
    const comma = inner.indexOf(",");
    into.add((comma === -1 ? inner : inner.slice(0, comma)).trim());
    if (comma !== -1) {
      const second = inner.indexOf(",", comma + 1);
      if (second !== -1) for (const arm of parseArms(inner.slice(second + 1), message)) placeholders(arm.body, into);
    }
    i = close + 1;
  }
  return into;
}
