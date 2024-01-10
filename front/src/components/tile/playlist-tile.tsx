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

import Playlist from "../../models/playlist";
import Tile from "./tile";
import Illustration from "../illustration";
import PlaylistContextualMenu from "../contextual-menu/playlist-contextual-menu";
import { PlaylistIcon } from "../icons";

const PlaylistTile = (props: { playlist: Playlist }) => {
	return (
		<Tile
			contextualMenu={
				<PlaylistContextualMenu playlist={props.playlist} />
			}
			title={props.playlist.name}
			href={`/playlists/${props.playlist.slug}`}
			illustration={
				<Illustration
					illustration={props.playlist.illustration}
					imgProps={{ objectFit: "cover" }}
					quality="medium"
					fallback={<PlaylistIcon />}
				/>
			}
		/>
	);
};

export default PlaylistTile;
