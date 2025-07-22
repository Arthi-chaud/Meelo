import i18next from "i18next";
import { atom } from "jotai";
import { type Language, Languages } from "~/i18n";
import { storage } from "~/utils/storage";

export const LanguageKey = "lang";

export const languagePreference = atom<Language, [Language], void>(
	(get) => get(_languagePreference),
	(_, set, lng) => {
		i18next.changeLanguage(lng);
		storage.set(LanguageKey, lng);
		set(_languagePreference, lng);
	},
);

const _languagePreference = atom<Language>(
	(storage.getString("lang") ?? Languages[0]) as Language,
);
