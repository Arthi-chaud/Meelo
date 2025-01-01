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
import { MetadataController } from "./registration.controller";
import { RegistrationService } from "./registration.service";
import ParserModule from "src/parser/parser.module";
import SettingsModule from "src/settings/settings.module";
import LibraryModule from "src/library/library.module";
import FileModule from "src/file/file.module";
import { HousekeepingModule } from "src/housekeeping/housekeeping.module";
import MetadataService from "./metadata.service";
import TrackModule from "src/track/track.module";
import SongModule from "src/song/song.module";
import ArtistModule from "src/artist/artist.module";
import AlbumModule from "src/album/album.module";
import GenreModule from "src/genre/genre.module";
import ReleaseModule from "src/release/release.module";
import IllustrationModule from "src/illustration/illustration.module";
import VideoModule from "src/video/video.module";

@Module({
	controllers: [MetadataController],
	providers: [RegistrationService, MetadataService],
	exports: [RegistrationService],
	imports: [
		ParserModule,
		SettingsModule,
		forwardRef(() => LibraryModule),
		forwardRef(() => SongModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => GenreModule),
		forwardRef(() => FileModule),
		forwardRef(() => TrackModule),
		forwardRef(() => VideoModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => HousekeepingModule),
	],
})
export class RegistrationModule {}
