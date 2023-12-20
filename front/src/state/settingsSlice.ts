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

import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Language } from "../i18n/i18n";
import { LanguageCookieKey, ThemeCookieKey } from "../utils/cookieKeys";
// eslint-disable-next-line no-restricted-imports
import { setCookie } from "cookies-next";

export const ColorSchemes = ["light", "dark", "system"] as const;

type ColorScheme = (typeof ColorSchemes)[number];

type SettingsState = {
	colorScheme: ColorScheme;
	language: Language | "system";
	allowNotifications: boolean;
};

export const settingsSlice = createSlice({
	name: "settings",
	initialState: <SettingsState>{
		colorScheme: "system",
		language: "system",
		allowNotifications: false,
	},
	reducers: {
		setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
			const expires = new Date();

			state.colorScheme = action.payload;

			expires.setMonth(expires.getMonth() + 1);
			setCookie(
				ThemeCookieKey,
				state.colorScheme,
				// Sets cookie for a month
				{ expires },
			);
		},
		setLanguage: (state, action: PayloadAction<Language>) => {
			const expires = new Date();

			state.language = action.payload;

			expires.setMonth(expires.getMonth() + 1);
			setCookie(
				LanguageCookieKey,
				state.language,
				// Sets cookie for a month
				{ expires },
			);
		},
		resetLanguage: (state) => {
			state.language = "system";
		},
		allowNotifications: (state) => {
			state.allowNotifications = true;
		},
		disableNotifications: (state) => {
			state.allowNotifications = false;
		},
	},
});

export const {
	setColorScheme,
	setLanguage,
	resetLanguage,
	allowNotifications,
	disableNotifications,
} = settingsSlice.actions;

export default settingsSlice.reducer;
