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
import ArtistService from "./artist.service";
import PrismaModule from "src/prisma/prisma.module";
import ArtistController from "./artist.controller";
import AlbumModule from "src/album/album.module";
import SongModule from "src/song/song.module";
import { ArtistResponseBuilder } from "./models/artist.response";
import SettingsModule from "src/settings/settings.module";
import TrackModule from "src/track/track.module";
import IllustrationModule from "src/illustration/illustration.module";
import { EventsModule } from "src/events/events.module";

@Module({
	imports: [
		PrismaModule,
		SettingsModule,
		EventsModule,
		forwardRef(() => IllustrationModule),
		forwardRef(() => SongModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => TrackModule),
	],
	exports: [ArtistService, ArtistResponseBuilder],
	providers: [ArtistService, ArtistResponseBuilder],
	controllers: [ArtistController],
})
export default class ArtistModule {}
