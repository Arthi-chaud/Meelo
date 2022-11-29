import { PayloadAction, createSlice } from "@reduxjs/toolkit";
// eslint-disable-next-line no-restricted-imports
import {
	deleteCookie, getCookie, setCookie
} from "cookies-next";
import User from "../models/user";
import UserAccessTokenCookieKey from "../utils/user-access-token-cookie-key";

type UserState = Partial<{
	user: User,
	accessToken: string
}>

export const userSlice = createSlice({
	name: 'context',
	initialState: <UserState>{
		user: undefined,
		accessToken: getCookie(UserAccessTokenCookieKey)
	},
	reducers: {
		setUserProfile: (state, action: PayloadAction<User>) => {
			state.user = action.payload;
		},
		setAccessToken: (state, action: PayloadAction<string>) => {
			state.accessToken = action.payload;
			setCookie(UserAccessTokenCookieKey, state.accessToken);
		},
		unsetAccessToken: (state) => {
			state.accessToken = undefined;
			deleteCookie(UserAccessTokenCookieKey);
		},
	}
});

export const { setAccessToken, setUserProfile, unsetAccessToken } = userSlice.actions;

export default userSlice.reducer;
