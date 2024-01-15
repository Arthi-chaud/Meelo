/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en";
import fr from "./translations/fr";
import { setCookie } from "cookies-next";
import { LanguageCookieKey } from "../utils/cookieKeys";

const Languages = ["en", "fr"] as const;
const Resources = { en, fr };

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		fr: { translation: fr },
	},
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
});

export const persistLanguage = (language: Language) => {
	const expires = new Date();

	expires.setMonth(expires.getMonth() + 1);
	setCookie(LanguageCookieKey, language, { expires });
};

export type Translator = (key: TranslationKey) => string;
export type TranslationMap = typeof en;
export type TranslationKey = keyof TranslationMap;
export type Language = keyof typeof Resources;
export { Languages };
export default i18n;
