import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type ColorScheme = 'light' | 'dark' | 'system';

type SettingsState = {
	colorScheme: ColorScheme;
}

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: <SettingsState>{
		colorScheme: 'dark'
	},
	reducers: {
		setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
			state.colorScheme = action.payload;
		},
	},
});

export const { setColorScheme } = settingsSlice.actions;

export default settingsSlice.reducer;
