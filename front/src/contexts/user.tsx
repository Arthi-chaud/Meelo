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

import { createContext, useContext, useState } from "react";
import type User from "../models/user";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { UserAccessTokenCookieKey } from "../utils/cookieKeys";

type UserState = Partial<{
	user: User;
	accessToken: string;
}>;

export type UserActions = {
	setUserProfile: (user: User) => void;
	unsetAccessToken: (user: User) => void;
	setAccessToken: (accessToken: string) => void;
};

const UserContext = createContext<UserState & UserActions>({
	user: undefined,
	accessToken: undefined,
	setUserProfile: () => {},
	unsetAccessToken: () => {},
	setAccessToken: () => {},
});

const UserContextProvider = (props: { children: JSX.Element }) => {
	const [userState, setUserState] = useState<UserState>({
		accessToken: getCookie(UserAccessTokenCookieKey) as string | undefined,
	});

	return (
		<UserContext.Provider
			value={{
				user: userState.user,
				accessToken: userState.accessToken,
				setUserProfile: (user) => {
					setUserState((state) => ({ ...state, user }));
				},
				unsetAccessToken: () => {
					setUserState(({ accessToken, ...state }) => state);
					deleteCookie(UserAccessTokenCookieKey);
				},

				setAccessToken: (token) => {
					const expires = new Date();

					expires.setMonth(expires.getMonth() + 1);
					setCookie(
						UserAccessTokenCookieKey,
						token,
						// Sets cookie for a month
						{ expires },
					);
					setUserState((state) => ({ ...state, accessToken: token }));
				},
			}}
		>
			{props.children}
		</UserContext.Provider>
	);
};

const useUserContext = () => useContext(UserContext);

export { useUserContext, UserContextProvider };
