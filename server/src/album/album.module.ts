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
import AlbumService from "./album.service";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import AlbumController from "./album.controller";
import ReleaseModule from "src/release/release.module";
import IllustrationModule from "src/illustration/illustration.module";
import TrackModule from "src/track/track.module";
import GenreModule from "../genre/genre.module";
import { AlbumResponseBuilder } from "./models/album.response";
import ProvidersModule from "src/providers/providers.module";
import ScannerModule from "src/parser/parser.module";

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => ProvidersModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule),
		GenreModule,
		forwardRef(() => ScannerModule),
	],
	exports: [AlbumService, AlbumResponseBuilder],
	providers: [AlbumService, AlbumResponseBuilder],
	controllers: [AlbumController],
})
export default class AlbumModule {}
