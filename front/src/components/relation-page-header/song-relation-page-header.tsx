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

import { RequireExactlyOne } from "type-fest";
import API from "../../api/api";
import { SongWithRelations } from "../../models/song";
import { useQuery } from "../../api/use-query";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";
import formatArtists from "../../utils/formatArtists";

type SongRelationPageHeaderProps = RequireExactlyOne<{
	songSlugOrId: number | string;
	song: SongWithRelations<"artist" | "featuring">;
}>;

const SongRelationPageHeader = (props: SongRelationPageHeaderProps) => {
	const song = useQuery(
		(id) => API.getSong(id, ["artist", "featuring"]),
		props.songSlugOrId,
	);

	if (props.song) {
		song.data = props.song;
	}
	if (!song.data) {
		return <WideLoadingComponent />;
	}
	return (
		<RelationPageHeader
			illustration={
				<Illustration
					illustration={song.data.illustration}
					quality="med"
				/>
			}
			title={song.data.name}
			secondTitle={formatArtists(song.data.artist, song.data.featuring)}
			trailing={<SongContextualMenu song={song.data} />}
		/>
	);
};

export default SongRelationPageHeader;
