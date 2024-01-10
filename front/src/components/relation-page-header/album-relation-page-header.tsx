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
import { useQuery } from "../../api/use-query";
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";
import { AlbumWithRelations } from "../../models/album";

type AlbumRelationPageHeaderProps = RequireExactlyOne<{
	albumSlugOrId: number | string;
	album: AlbumWithRelations<"artist">;
}>;

const AlbumRelationPageHeader = (props: AlbumRelationPageHeaderProps) => {
	const album = useQuery(
		(id) => API.getAlbum(id, ["artist"]),
		props.albumSlugOrId,
	);

	if (props.album) {
		album.data = props.album;
	}
	if (!album.data) {
		return <WideLoadingComponent />;
	}
	return (
		<RelationPageHeader
			illustration={
				<Illustration
					illustration={album.data.illustration}
					quality="medium"
				/>
			}
			title={album.data.name}
			secondTitle={album.data.artist?.name}
			trailing={<AlbumContextualMenu album={album.data} />}
		/>
	);
};

export default AlbumRelationPageHeader;
