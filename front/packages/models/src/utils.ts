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
import type { AlbumType } from "@/models/album";
import type { VideoType } from "@/models/video";
import { uncapitalize } from "@/utils/uncapitalize";
import type { SongType } from "./song";

//

export function union<
	T1,
	T2,
	TCast1 extends yup.Maybe<T1>,
	TCast2 extends yup.Maybe<T2>,
	C1,
	C2,
	O1 extends T1,
	O2 extends T2,
>(
	...schemas: [yup.Schema<TCast1, C1, O1>, yup.Schema<TCast2, C2, O2>]
): yup.MixedSchema<TCast1 | TCast2, C1 | C2, O1 | O2>;

export function union<
	T1,
	T2,
	T3,
	TCast1 extends yup.Maybe<T1>,
	TCast2 extends yup.Maybe<T2>,
	TCast3 extends yup.Maybe<T3>,
	C1,
	C2,
	C3,
	O1 extends T1,
	O2 extends T2,
	O3 extends T3,
>(
	...schemas: [
		yup.Schema<TCast1, C1, O1>,
		yup.Schema<TCast2, C2, O2>,
		yup.Schema<TCast3, C3, O3>,
	]
): yup.MixedSchema<TCast1 | TCast2 | TCast3, C1 | C2 | C3, O1 | O2 | O3>;

export function union<TCast extends yup.Maybe<unknown>, C, O>(
	...schemas: Array<yup.Schema<TCast, C, O>>
): yup.MixedSchema<TCast, C, O> {
	return yup.mixed().test({
		name: "union",
		test(value) {
			// The real magic
			return schemas.some((s) => s.isValidSync(value));
		},
	}) as unknown as yup.MixedSchema<TCast, C, O>;
}

// We need this as re-hydrared dates are still strings
export const yupdate = union(yup.string().nullable(), yup.date().nullable());

export const albumTypeToTranslationKey = (
	albumType: AlbumType,
	plural: boolean,
): TranslationKey =>
	albumType === "EP"
		? `albumType.ep${plural ? "_plural" : ""}`
		: `albumType.${uncapitalize(albumType)}${plural ? "_plural" : ""}`;

export const songTypeToTranslationKey = (
	songType: SongType,
	_plural: false,
): TranslationKey => `songType.${uncapitalize(songType)}`;

export const videoTypeToTranslationKey = (
	videoType: VideoType,
	_plural: false,
): TranslationKey => `videoType.${uncapitalize(videoType)}`;
