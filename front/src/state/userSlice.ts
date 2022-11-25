import { PayloadAction, createSlice } from "@reduxjs/toolkit";
// eslint-disable-next-line no-restricted-imports
import {
	deleteCookie, getCookie, setCookie
} from "cookies-next";
import UserAccessTokenCookieKey from "../utils/user-access-token-cookie-key";

type UserState = {
	accessToken?: string
}

export const userSlice = createSlice({
	name: 'context',
	initialState: <UserState>{
		accessToken: getCookie(UserAccessTokenCookieKey)
	},
	reducers: {
		setAccessToken: (state, action: PayloadAction<string | undefined>) => {
			state.accessToken = action.payload;
			setCookie(UserAccessTokenCookieKey, state.accessToken);
		},
		unsetAccessToken: (state) => {
			state.accessToken = undefined;
			deleteCookie(UserAccessTokenCookieKey);
		},
	}
});

export const { setAccessToken } = userSlice.actions;

export default userSlice.reducer;
