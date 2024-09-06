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
import LibraryModule from "src/library/library.module";
import TasksController from "./tasks.controller";
import TrackModule from "src/track/track.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileModule from "src/file/file.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ScannerModule from "src/parser/parser.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import ReleaseModule from "src/release/release.module";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import GenreModule from "src/genre/genre.module";
import ProvidersModule from "src/providers/providers.module";
import TaskRunner, { TaskQueue } from "./tasks.runner";
import { BullModule } from "@nestjs/bull";
import PlaylistModule from "src/playlist/playlist.module";
import { HousekeepingModule } from "src/housekeeping/housekeeping.module";

@Module({
	imports: [
		BullModule.registerQueue({
			name: TaskQueue,
		}),
		forwardRef(() => LibraryModule),
		FileManagerModule,
		forwardRef(() => FileModule),
		forwardRef(() => TrackModule),
		forwardRef(() => ScannerModule),
		LyricsModule,
		SettingsModule,
		HousekeepingModule,
		forwardRef(() => ProvidersModule),
		forwardRef(() => SongModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => GenreModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => PlaylistModule),
	],
	controllers: [TasksController],
	providers: [TaskRunner],
	exports: [TaskRunner],
})
export default class TasksModule {}
