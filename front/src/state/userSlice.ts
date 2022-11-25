import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getCookie } from "cookies-next";
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
		},
		unsetAccessToken: (state) => {
			state.accessToken = undefined;
		},
	}
});

export const { setAccessToken } = userSlice.actions;

export default userSlice.reducer;
