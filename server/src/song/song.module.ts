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
import ArtistModule from "src/artist/artist.module";
import { EventsModule } from "src/events/events.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import PrismaModule from "src/prisma/prisma.module";
import ReleaseModule from "src/release/release.module";
import TrackModule from "src/track/track.module";
import { SongResponseBuilder } from "./models/song.response";
import { SongGroupResponseBuilder } from "./models/song-group.response";
import { SongController } from "./song.controller";
import SongService from "./song.service";
import { SongGroupController } from "./song-group.controller";
import SongGroupService from "./song-group.service";

@Module({
	imports: [
		PrismaModule,
		EventsModule,
		forwardRef(() => LyricsModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => TrackModule),
		forwardRef(() => GenreModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => ParserModule),
	],
	exports: [
		SongService,
		SongGroupService,
		SongResponseBuilder,
		SongGroupResponseBuilder,
	],
	providers: [
		SongService,
		SongGroupService,
		SongResponseBuilder,
		SongGroupResponseBuilder,
	],
	controllers: [SongController, SongGroupController],
})
export default class SongModule {}
