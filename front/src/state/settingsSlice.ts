import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Language } from '../i18n/i18n';

type ColorScheme = 'light' | 'dark' | 'system';

type SettingsState = {
	colorScheme: ColorScheme;
	language: Language | 'system'
}

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: <SettingsState>{
		colorScheme: 'dark',
		language: 'system',
	},
	reducers: {
		setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
			state.colorScheme = action.payload;
		},
		setLanguage: (state, action: PayloadAction<Language>) => {
			state.language = action.payload;
		},
		resetLanguage: (state) => {
			state.language = 'system';
		}
	},
});

export const { setColorScheme, setLanguage, resetLanguage } = settingsSlice.actions;

export default settingsSlice.reducer;
