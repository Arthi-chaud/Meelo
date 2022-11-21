import { configureStore } from '@reduxjs/toolkit';
import playlerSlice from './playerSlice';

const store = configureStore({
	reducer: {
		player: playlerSlice
	},
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store;
