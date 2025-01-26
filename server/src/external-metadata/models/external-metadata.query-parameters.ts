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

import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type SongQueryParameters from "src/song/models/song.query-params";
import type { RequireExactlyOne } from "type-fest";

namespace ExternalMetadataQueryParameters {
	export type WhereInput = RequireExactlyOne<{
		id: number;
		album: AlbumQueryParameters.WhereInput;
		song: SongQueryParameters.WhereInput;
		artist: ArtistQueryParameters.WhereInput;
		release: ReleaseQueryParameters.WhereInput;
	}>;
}

export default ExternalMetadataQueryParameters;
