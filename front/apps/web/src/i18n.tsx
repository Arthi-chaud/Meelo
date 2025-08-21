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

import ALParser from "accept-language-parser";
import { getCookie, setCookie } from "cookies-next";
import i18next, {
	type CustomTypeOptions,
	type InitOptions,
	type KeysBuilderWithoutReturnObjects,
} from "i18next";
import type { AppContext, AppInitialProps, AppProps } from "next/app";
import { type ComponentType, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { LanguageStorageKey } from "@/utils/constants";
import { isSSR } from "~/utils/is-ssr";
import translations, { type Language, Languages } from "../../../translations";

export { Languages, type Language };

export const persistLanguage = (language: Language) => {
	const expires = new Date();

	expires.setMonth(expires.getMonth() + 1);
	setCookie(LanguageStorageKey, language, { expires });
};

// Thx https://github.com/zoriya/Kyoo/blob/master/front/apps/web/src/i18n.tsx

export const withTranslations = (
	AppToTranslate: ComponentType<AppProps> & {
		getInitialProps?: (ctx: AppContext) => Promise<AppInitialProps>;
	},
) => {
	const i18n = i18next.createInstance();
	const commonOptions: InitOptions = {
		interpolation: {
			escapeValue: false,
		},
		returnEmptyString: false,
		fallbackLng: "en",
	};

	const AppWithTranslations = (props: AppProps) => {
		const li18n = useMemo(
			() =>
				isSSR()
					? i18n
					: (i18next.init({
							...commonOptions,
							lng: props.pageProps.__lang,
							resources: props.pageProps.__resources,
							// biome-ignore lint/complexity/noCommaOperator: OK
						}),
						i18next),
			[props.pageProps.__lang, props.pageProps.__resources],
		);

		return (
			<I18nextProvider i18n={li18n}>
				<AppToTranslate {...props} />
			</I18nextProvider>
		);
	};
	AppWithTranslations.getInitialProps = async (ctx: AppContext) => {
		const props = (await AppToTranslate.getInitialProps?.(ctx)) ?? {
			pageProps: {},
		};
		const lng =
			getCookie(LanguageStorageKey)?.toString() ??
			Languages.find(
				//@ts-expect-error
				(lang) => lang === ctx.ctx.req?.cookies[LanguageStorageKey],
			) ??
			ALParser.pick(
				Array.from(Languages),
				ctx.ctx.req?.headers["accept-language"] ?? "en",
				{ loose: true },
			) ??
			"en";
		const resources = translations;
		await i18n.init({
			...commonOptions,
			lng,
			fallbackLng: ctx.router.defaultLocale || commonOptions.fallbackLng,
			resources,
		});
		props.pageProps.__lang = lng;
		props.pageProps.__resources = resources;
		return props;
	};

	return AppWithTranslations;
};

declare global {
	// https://github.com/i18next/i18next/blob/master/typescript/t.d.ts
	type TranslationKey = KeysBuilderWithoutReturnObjects<
		CustomTypeOptions["resources"]["translation"]
	>;

	type Translator = (key: TranslationKey) => string;
}
