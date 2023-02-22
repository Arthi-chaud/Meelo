import { configureStore } from '@reduxjs/toolkit';
import userSlice from './userSlice';
import playlerSlice from './playerSlice';
import settingsSlice from './settingsSlice';

const store = configureStore({
	reducer: {
		player: playlerSlice,
		user: userSlice,
		settings: settingsSlice
	},
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store;
