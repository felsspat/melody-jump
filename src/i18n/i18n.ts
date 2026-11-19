// Localization: all user-facing text lives in texts.json. Every leaf holds one
// value per language ({ "de": ..., "en": ... }). The default language is the
// browser language; the player can switch it on the title screen.

import texts from './texts.json';

export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

type Leaf = Record<Locale, string | string[]>;
type Tree = { [key: string]: Tree | Leaf };

const FALLBACK: Locale = 'en';
const STORAGE_KEY = 'melody-jump-locale';
const root = texts as unknown as Tree;

let current: Locale = FALLBACK;
const listeners: ((l: Locale) => void)[] = [];

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

/** Picks the language: ?lang= in the URL, then the saved choice, then the browser language. */
export function detectLocale(): Locale {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isLocale(fromUrl)) return fromUrl;
  } catch {
    /* no window (tests) */
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  const langs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  for (const l of langs) {
    const short = l?.slice(0, 2).toLowerCase();
    if (isLocale(short)) return short;
  }
  return FALLBACK;
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale, persist = false): void {
  current = locale;
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* storage unavailable */
    }
  }
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
  for (const cb of listeners) cb(locale);
}

/** Called whenever the language changes (also used to refresh cached text). */
export function onLocaleChange(cb: (l: Locale) => void): void {
  listeners.push(cb);
}

function lookup(key: string): Leaf | undefined {
  let node: Tree | Leaf | undefined = root;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return undefined;
    node = (node as Tree)[part];
  }
  if (node && typeof node === 'object' && FALLBACK in node) return node as Leaf;
  return undefined;
}

function interpolate(s: string, params?: Record<string, string | number>): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

function value(key: string, locale: Locale): string | string[] | undefined {
  const leaf = lookup(key);
  if (!leaf) return undefined;
  return leaf[locale] ?? leaf[FALLBACK];
}

/** Translated text for a key, with {placeholder} substitution. Missing keys return the key itself. */
export function t(key: string, params?: Record<string, string | number>, locale: Locale = current): string {
  const v = value(key, locale);
  if (v === undefined) return key;
  return interpolate(Array.isArray(v) ? v.join(' ') : v, params);
}

/** Translated list (e.g. paragraph lines). */
export function tl(key: string, params?: Record<string, string | number>, locale: Locale = current): string[] {
  const v = value(key, locale);
  if (v === undefined) return [key];
  return (Array.isArray(v) ? v : [v]).map((s) => interpolate(s, params));
}

/** All keys whose leaves are missing a translation for some locale (used by tests). */
export function missingTranslations(): string[] {
  const missing: string[] = [];
  const walk = (node: Tree | Leaf, path: string): void => {
    if (FALLBACK in node) {
      for (const l of LOCALES) if ((node as Leaf)[l] === undefined) missing.push(`${path} [${l}]`);
      return;
    }
    for (const [k, child] of Object.entries(node as Tree)) walk(child, path ? `${path}.${k}` : k);
  };
  walk(root, '');
  return missing;
}
