import { StateFromReducersMapObject, configureStore } from '@reduxjs/toolkit';
import userSlice from './userSlice';
import playlerSlice from './playerSlice';
import settingsSlice from './settingsSlice';
import storage from 'redux-persist/lib/storage';
import {
	FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE,
	persistCombineReducers, persistStore
} from 'redux-persist';
import { CurriedGetDefaultMiddleware } from '@reduxjs/toolkit/dist/getDefaultMiddleware';
import { PersistPartial } from 'redux-persist/es/persistReducer';

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
const getStorage = () => typeof window === 'undefined'
	? createNoopStorage() // For SSR
	: storage;

const Reducers = {
	player: playlerSlice,
	user: userSlice,
	settings: settingsSlice
};

const PersistConfig = {
	key: 'root',
	storage: getStorage(),
	whitelist: ['settings'] // Keys of reducers to persist
};

type State = StateFromReducersMapObject<typeof Reducers>;
type GetDefaultMiddleware = CurriedGetDefaultMiddleware<State & PersistPartial>

const store = configureStore({
	reducer: persistCombineReducers(PersistConfig, Reducers),
	middleware: (getDefaultMiddleware: GetDefaultMiddleware) => getDefaultMiddleware({
		serializableCheck: {
			ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
		},
	}),
});

const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store;
export { persistor };
