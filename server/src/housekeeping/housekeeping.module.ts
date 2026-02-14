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

import { forwardRef, Module } from "@nestjs/common";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import GenreModule from "src/genre/genre.module";
import LabelModule from "src/label/label.module";
import PlaylistModule from "src/playlist/playlist.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import VideoModule from "src/video/video.module";
import { HousekeepingService } from "./housekeeping.service";

@Module({
	imports: [
		forwardRef(() => SongModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => GenreModule),
		forwardRef(() => PlaylistModule),
		forwardRef(() => VideoModule),
		forwardRef(() => LabelModule),
	],
	providers: [HousekeepingService],
	exports: [HousekeepingService],
})
export class HousekeepingModule {}
