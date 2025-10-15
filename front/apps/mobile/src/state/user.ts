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

import { atom } from "jotai";
import { storage } from "~/utils/storage";

const AccessTokenKey = "access-token";
const InstanceUrlKey = "instance-url";

export const instanceUrlAtom = atom<string | null, [string | null], void>(
	(get) => get(_instanceUrlAtom),
	(_, set, update) => {
		if (update !== null) {
			storage.set(InstanceUrlKey, update);
		} else {
			storage.remove(InstanceUrlKey);
		}
		set(_instanceUrlAtom, update);
	},
);

const _instanceUrlAtom = atom(storage.getString(InstanceUrlKey) ?? null);

export const accessTokenAtom = atom<string | null, [string | null], void>(
	(get) => get(_accessToken),
	(_, set, update) => {
		if (update !== null) {
			const expires = new Date();

			expires.setMonth(expires.getMonth() + 1);
			storage.set(AccessTokenKey, update);
		} else {
			storage.remove(AccessTokenKey);
		}
		set(_accessToken, update);
	},
);
const _accessToken = atom<string | null>(
	storage.getString(AccessTokenKey) ?? null,
);
