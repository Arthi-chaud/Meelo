import { configureStore } from '@reduxjs/toolkit'
import contextSlice from './contextSlice';
import playlerSlice from './playerSlice';

const store = configureStore({
	reducer: {
		player: playlerSlice,
		context: contextSlice
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store;