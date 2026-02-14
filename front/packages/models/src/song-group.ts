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
import Song, { type SongInclude, SongRelations } from "./song";

/**
 * Abstract data model, instanciated by tracks
 */
export const SongGroup = Song.concat(
	yup.object({
		versionCount: yup.number().required(),
		songId: yup.number().required(),
	}),
);

export type SongGroup = yup.InferType<typeof SongGroup>;

export type SongGroupInclude = SongInclude;

export const SongGroupRelations = SongRelations;

export const SongGroupWithRelations = <
	Selection extends SongGroupInclude | never = never,
>(
	relation: Selection[],
) => SongGroup.concat(SongGroupRelations.pick(relation));

export type SongGroupWithRelations<
	Selection extends SongGroupInclude | never = never,
> = yup.InferType<ReturnType<typeof SongGroupWithRelations<Selection>>>;

export default SongGroup;
export const SongGroupSortingKeys = ["name"] as const;
