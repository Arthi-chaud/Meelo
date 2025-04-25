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

import * as yup from "yup";

/**
 * Parameters for pagination in API requests
 */
export type PaginationParameters = {
	/**
	 * The id of the last item of the previou page
	 */
	afterId?: number;
	pageSize?: number;
};

const PaginatedResponse = <T>(itemType: yup.Schema<T>) =>
	yup.object({
		items: yup.array(itemType).required(),
		metadata: yup.object({
			/**
			 * Current route
			 */
			this: yup.string().required(),
			/**
			 * route to use for the next items
			 */
			next: yup.string().required().nullable(),
			/**
			 * route to use for the previous items
			 */
			previous: yup.string().required().nullable(),
			/**
			 * The current page number
			 */
			page: yup.number().required().nullable(),
		}),
	});

type PaginatedResponse<T> = yup.InferType<
	ReturnType<typeof PaginatedResponse<T>>
>;

export default PaginatedResponse;
