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

import {
	type StateFromReducersMapObject,
	configureStore,
} from "@reduxjs/toolkit";
import type { CurriedGetDefaultMiddleware } from "@reduxjs/toolkit/dist/getDefaultMiddleware";
import {
	FLUSH,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
	REHYDRATE,
	persistCombineReducers,
	persistStore,
} from "redux-persist";
import type { PersistPartial } from "redux-persist/es/persistReducer";
import storage from "redux-persist/lib/storage";
import { isSSR } from "../utils/is-ssr";
import userSlice from "./userSlice";

const createNoopStorage = () => {
	return {
		getItem(_key: any) {
			return Promise.resolve(null);
		},
		setItem(_key: any, value: any) {
			return Promise.resolve(value);
		},
		removeItem(_key: any) {
			return Promise.resolve();
		},
	};
};

// Get storage type, depending of SSR or client side
const getStorage = () =>
	isSSR()
		? createNoopStorage() // For SSR
		: storage;

const Reducers = {
	user: userSlice,
};

const PersistConfig = {
	key: "root",
	storage: getStorage(),
	whitelist: [], // Keys of reducers to persist
};

type State = StateFromReducersMapObject<typeof Reducers>;
type GetDefaultMiddleware = CurriedGetDefaultMiddleware<State & PersistPartial>;

const store = configureStore({
	reducer: persistCombineReducers(PersistConfig, Reducers),
	middleware: (getDefaultMiddleware: GetDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [
					FLUSH,
					REHYDRATE,
					PAUSE,
					PERSIST,
					PURGE,
					REGISTER,
				],
			},
		}),
});

const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
export { persistor };
