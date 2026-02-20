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
import Resource from "./resource";

/**
 * 'Instance' of a song on a release
 */
const Label = Resource.concat(
	yup.object({
		slug: yup.string().required(),
		name: yup.string().required(),
	}),
);

type Label = yup.InferType<typeof Label>;

export default Label;

export const LabelSortingKeys = ["name", "albumCount"] as const;
