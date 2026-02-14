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
import FileModule from "src/file/file.module";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import TrackModule from "src/track/track.module";
import { ReleaseResponseBuilder } from "./models/release.response";
import ReleaseController from "./release.controller";
import ReleaseService from "./release.service";

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => TrackModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => FileModule),
	],
	controllers: [ReleaseController],
	providers: [ReleaseService, ReleaseResponseBuilder],
	exports: [ReleaseService, ReleaseResponseBuilder],
})
export default class ReleaseModule {}
