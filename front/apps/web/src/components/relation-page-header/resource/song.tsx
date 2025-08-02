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

import type { RequireExactlyOne } from "type-fest";
import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import SongContextualMenu from "~/components/contextual-menu/resource/song";
import Illustration from "~/components/illustration";
import RelationPageHeader from "~/components/relation-page-header";

type SongRelationPageHeaderProps = RequireExactlyOne<{
	song:
		| SongWithRelations<"artist" | "featuring" | "illustration">
		| undefined;
}>;

const SongRelationPageHeader = ({ song }: SongRelationPageHeaderProps) => {
	return (
		<RelationPageHeader
			illustration={
				<Illustration
					illustration={song ? song.illustration : undefined}
					quality="medium"
				/>
			}
			title={song?.name}
			secondTitle={
				song ? formatArtists(song.artist, song.featuring) : undefined
			}
			trailing={song ? <SongContextualMenu song={song} /> : undefined}
		/>
	);
};

export default SongRelationPageHeader;
