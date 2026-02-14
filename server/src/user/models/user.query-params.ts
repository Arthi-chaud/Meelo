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

import type { User } from "src/prisma/models";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import type { RequireExactlyOne } from "type-fest";

namespace UserQueryParameters {
	/**
	 * Parameeters to create a user
	 */
	export type CreateInput = Omit<User, "id" | "enabled" | "admin"> &
		Partial<Pick<User, "enabled" | "admin">>;

	/**
	 * Parameters to find one users
	 */
	export type WhereInput = RequireExactlyOne<{
		id: User["id"];
		byCredentials: Pick<User, "name" | "password">;
		byJwtPayload: Pick<User, "name" | "id">;
		name: User["name"];
	}>;

	/**
	 * Parameters to find multiple users
	 */
	export type ManyWhereInput = Partial<
		Pick<User, "admin" | "enabled"> & { id: { in: number[] } }
	>;

	/**
	 * Parameters to update a user
	 */
	export type UpdateInput = Partial<Omit<User, "id">>;

	/**
	 * Query parameters to delete one user
	 */
	export type DeleteInput = RequireExactlyOne<Pick<User, "id" | "name">>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = ["id", "name", "admin", "enabled"] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default UserQueryParameters;
