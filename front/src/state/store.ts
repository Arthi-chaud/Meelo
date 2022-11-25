<<<<<<< HEAD
import { configureStore } from '@reduxjs/toolkit'
import contextSlice from './contextSlice';
=======
import { configureStore } from '@reduxjs/toolkit';
>>>>>>> 207f59f703c61e5c574b09b0dc65e9f3a8354405
import playlerSlice from './playerSlice';

const store = configureStore({
	reducer: {
		player: playlerSlice,
		context: contextSlice
	},
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store;
