import { configureStore } from '@reduxjs/toolkit';
import userSlice from './userSlice';
import playlerSlice from './playerSlice';

const store = configureStore({
	reducer: {
		player: playlerSlice,
		user: userSlice
	},
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store;
