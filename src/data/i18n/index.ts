/**
 * Lightweight UI translation for the IPHC MMUSO app (React).
 *
 * English (`locales/en.ts`) is the source of truth and the fallback for any
 * key missing in the active locale. The active locale is remembered in
 * localStorage only — nothing is stored server-side.
 *
 * Usage:
 *   const { t, locale, setLocale } = useTranslation();
 *   t('tabs.home'); t('dash.greeting', { name: 'Thabo' });
 */
import { useCallback, useSyncExternalStore } from 'react';
import en, { type DeepPartial, type Translation } from './locales/en';
import st from './locales/st';
import tn from './locales/tn';

export const LOCALES = [
	{ code: 'en', label: 'English' },
	{ code: 'st', label: 'Sesotho' },
	{ code: 'tn', label: 'Setswana' }
] as const;

export type Locale = (typeof LOCALES)[number]['code'];

export type { DeepPartial };

type Dictionary = DeepPartial<Translation>;

const dictionaries: Record<Locale, Dictionary> = {
	en,
	st,
	tn
};

const STORAGE_KEY = 'iphc-locale';

type Listener = () => void;

let locale: Locale = 'en';
const listeners = new Set<Listener>();

// Hydrate from a previous session. Client-only guard keeps HMR/SSR safe.
if (typeof window !== 'undefined') {
	const saved = window.localStorage.getItem(STORAGE_KEY);
	if (saved && saved in dictionaries) locale = saved as Locale;
}

function emit() {
	listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function setLocale(code: Locale) {
	if (code === locale) return;
	locale = code;
	if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, code);
	emit();
}

export function getLocale(): Locale {
	return locale;
}

type Paths<T> = T extends string
	? never
	: {
			[K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
		}[keyof T & string];

export type TranslationKey = Paths<Translation>;

function lookup(dict: Dictionary | Translation, key: string): string | undefined {
	let node: unknown = dict;
	for (const part of key.split('.')) {
		if (typeof node !== 'object' || node === null) return undefined;
		node = (node as Record<string, unknown>)[part];
	}
	return typeof node === 'string' ? node : undefined;
}

/** Translate `key` into the given locale, falling back to English. */
export function translate(code: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
	let value = lookup(dictionaries[code], key) ?? lookup(en, key) ?? key;
	if (params) {
		value = value.replace(/\{(\w+)\}/g, (match, name: string) =>
			name in params ? String(params[name]) : match
		);
	}
	return value;
}

/** Translate `key` in the currently active locale (non-hook convenience). */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
	return translate(locale, key, params);
}

/** BCP-47 tag for date formatting in the given locale. */
export function dateLocale(code: Locale = locale): string {
	return `${code}-ZA`;
}

export interface TranslationApi {
	locale: Locale;
	setLocale: (code: Locale) => void;
	t: (key: TranslationKey, params?: Record<string, string | number>) => string;
	/** BCP-47 tag matching the active locale, for Intl date/number formatting. */
	dateLocale: string;
}

/**
 * Subscribe a component to the active locale. Re-renders automatically
 * whenever `setLocale` changes it (e.g. from the settings language picker).
 */
export function useTranslation(): TranslationApi {
	const active = useSyncExternalStore(subscribe, getLocale, getLocale);

	const boundT = useCallback(
		(key: TranslationKey, params?: Record<string, string | number>) => translate(active, key, params),
		[active]
	);

	return {
		locale: active,
		setLocale,
		t: boundT,
		dateLocale: dateLocale(active)
	};
}
