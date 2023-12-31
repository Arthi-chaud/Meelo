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
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileModule from "src/file/file.module";
import GenresModule from "src/genre/genre.module";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import ScannerService from "./scanner.service";
import ParserService from "./parser.service";
import FfmpegService from "./ffmpeg.service";
import SongVersionModule from "src/song-version/song-version.module";

@Module({
	imports: [
		SettingsModule,
		FileManagerModule,
		forwardRef(() => TrackModule),
		forwardRef(() => SongModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => GenresModule),
		forwardRef(() => FileModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => SongVersionModule),
	],
	providers: [ScannerService, ParserService, FfmpegService],
	exports: [ScannerService, ParserService, FfmpegService],
})
export default class ScannerModule {}
