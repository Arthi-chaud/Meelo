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

const ExternalId = yup.object({
	/**
	 * Info about the provider
	 */
	provider: yup
		.object({
			/**
			 * Name of the Provider
			 */
			name: yup.string().required(),
			/**
			 * URL to the Homepage of the provider
			 */
			homepage: yup.string().required(),
			/**
			 * API-relative route to the provider's icon
			 */
			icon: yup.string().required(),
		})
		.required(),
	/**
	 * Value of the External Identifier
	 */
	value: yup.string().required(),
	/**
	 * Description of the resource, from the External Identifier
	 */
	description: yup.string().defined().strict(true).nullable(),
	/**
	 * URL to the related resource
	 */
	url: yup.string().required().nullable(),
});

type ExternalId = yup.InferType<typeof ExternalId>;

export default ExternalId;
