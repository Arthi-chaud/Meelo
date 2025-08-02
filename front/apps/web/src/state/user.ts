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

import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { atom } from "jotai";
import type User from "@/models/user";
import { UserAccessTokenStorageKey } from "@/utils/constants";

export const userAtom = atom<User | undefined>();

export const accessTokenAtom = atom<
	string | undefined,
	[string | undefined],
	void
>(
	(get) => get(_accessToken),
	(_, set, update) => {
		if (update !== undefined) {
			const expires = new Date();

			expires.setMonth(expires.getMonth() + 1);
			setCookie(
				UserAccessTokenStorageKey,
				update,
				// Sets cookie for a month
				{ expires },
			);
		} else {
			deleteCookie(UserAccessTokenStorageKey);
		}
		set(_accessToken, update);
	},
);
const _accessToken = atom<string | undefined>(
	getCookie(UserAccessTokenStorageKey)?.valueOf().toString(),
);
