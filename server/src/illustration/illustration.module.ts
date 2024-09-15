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
import IllustrationService from "./illustration.service";
import FileManagerModule from "src/file-manager/file-manager.module";
import ReleaseModule from "src/release/release.module";
import AlbumModule from "src/album/album.module";
import TrackModule from "src/track/track.module";
import FileModule from "src/file/file.module";
import { IllustrationController } from "./illustration.controller";
import ArtistModule from "src/artist/artist.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import PlaylistModule from "src/playlist/playlist.module";
import IllustrationRepository from "./illustration.repository";
import PrismaModule from "src/prisma/prisma.module";
import ParserModule from "src/parser/parser.module";
import { HttpModule } from "@nestjs/axios";
import { RegistrationModule } from "src/registration/registration.module";

@Module({
	imports: [
		PrismaModule,
		HttpModule,
		FileManagerModule,
		forwardRef(() => ArtistModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule),
		forwardRef(() => SongModule),
		forwardRef(() => FileModule),
		forwardRef(() => PlaylistModule),
		forwardRef(() => RegistrationModule),
		SettingsModule,
		forwardRef(() => ParserModule),
	],
	controllers: [IllustrationController],
	providers: [IllustrationService, IllustrationRepository],
	exports: [IllustrationService, IllustrationRepository],
})
export default class IllustrationModule {}
