import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Language } from '../i18n/i18n';
import { LanguageCookieKey, ThemeCookieKey } from '../utils/cookieKeys';
// eslint-disable-next-line no-restricted-imports
import { setCookie } from 'cookies-next';

export const ColorSchemes = ['light', 'dark', 'system'] as const;

type ColorScheme = typeof ColorSchemes[number];

type SettingsState = {
	colorScheme: ColorScheme;
	language: Language | 'system',
	allowNotifications: boolean,
}

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: <SettingsState>{
		colorScheme: 'dark',
		language: 'system',
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
				{ expires }
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
				{ expires }
			);
		},
		resetLanguage: (state) => {
			state.language = 'system';
		},
		allowNotifications: (state) => {
			state.allowNotifications = true;
		},
		disableNotifications: (state) => {
			state.allowNotifications = false;
		}
	},
});

export const { setColorScheme, setLanguage, resetLanguage, allowNotifications, disableNotifications } = settingsSlice.actions;

export default settingsSlice.reducer;
