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

import { Module, forwardRef } from "@nestjs/common";
import { TrackController } from "./track.controller";
import FileModule from "src/file/file.module";
import PrismaModule from "src/prisma/prisma.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackService from "./track.service";
import IllustrationModule from "src/illustration/illustration.module";
import AlbumModule from "src/album/album.module";
import { TrackResponseBuilder } from "./models/track.response";
import { TracklistResponseBuilder } from "./models/tracklist.model";
import SongVersionModule from "src/song-version/song-version.module";

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => FileModule),
		forwardRef(() => SongVersionModule),
	],
	exports: [TrackService, TrackResponseBuilder, TracklistResponseBuilder],
	providers: [TrackService, TrackResponseBuilder, TracklistResponseBuilder],
	controllers: [TrackController],
})
export default class TrackModule {}
