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
import type Resource from "./resource";

const Illustration = yup
	.object({
		// URL to the illustration
		url: yup.string().required(),
		/**
		 * Blurhash value of the illustration
		 */
		blurhash: yup.string().required(),
		/**
		 * Aspect Ratio of The Image
		 */
		aspectRatio: yup.number().required(),
		colors: yup
			.array(
				yup
					.string()
					.required()
					.transform((color: string) => {
						const afterHash = color.slice(1);
						return `#${afterHash.padStart(6, "0")}`;
					}),
			)
			.required(),
	})
	.required();

type Illustration = yup.InferType<typeof Illustration>;

export type IllustrationQuality = "low" | "medium" | "high" | "original";

export type IllustratedResource = Resource & {
	illustration: Illustration | null;
};

export default Illustration;
