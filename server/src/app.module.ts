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

import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import FileModule from "./file/file.module";
import ArtistModule from "./artist/artist.module";
import AlbumModule from "./album/album.module";
import ReleaseModule from "./release/release.module";
import TrackModule from "./track/track.module";
import SongModule from "./song/song.module";
import SettingsModule from "./settings/settings.module";
import LibraryModule from "./library/library.module";
import IllustrationModule from "./illustration/illustration.module";
import FileManagerModule from "./file-manager/file-manager.module";
import ScannerModule from "./scanner/scanner.module";
import PrismaModule from "./prisma/prisma.module";
import { LyricsModule } from "./lyrics/lyrics.module";
import GenreModule from "./genre/genre.module";
import AppController from "./app.controller";
import TasksModule from "./tasks/tasks.module";
import { ScheduleModule } from "@nestjs/schedule";
import AuthenticationModule from "./authentication/authentication.module";
import UserModule from "./user/user.module";
import ProvidersModule from "./providers/providers.module";
import LoggerModule from "./logger/logger.module";
import * as Plugins from "./app.plugins";
import { BullModule } from "@nestjs/bull";
import VideoModule from "./video/video.module";
import PlaylistModule from "./playlist/playlist.module";
import { MeiliSearchModule } from "nestjs-meilisearch";
import { StreamModule } from "./stream/stream.module";
import { SearchModule } from "./search/search.module";

@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot(),
		MeiliSearchModule.forRoot({
			host: process.env.MEILI_HOST!,
			apiKey: process.env.MEILI_MASTER_KEY,
		}),
		BullModule.forRoot({
			redis: {
				host: process.env.REDIS_HOST,
				port: 6379,
			},
			defaultJobOptions: {
				attempts: 1,
				removeOnComplete: true,
				removeOnFail: true,
			},
		}),
		ArtistModule,
		AlbumModule,
		SongModule,
		LibraryModule,
		TrackModule,
		ReleaseModule,
		IllustrationModule,
		ScannerModule,
		PrismaModule,
		FileModule,
		SettingsModule,
		FileManagerModule,
		GenreModule,
		LyricsModule,
		TasksModule,
		AuthenticationModule,
		UserModule,
		LoggerModule,
		ProvidersModule,
		PlaylistModule,
		VideoModule,
		ScannerModule,
		StreamModule,
		SearchModule,
	],
	controllers: [AppController],
	providers: Plugins.AppProviders,
})
export default class AppModule {
	configure(consumer: MiddlewareConsumer) {
		Plugins.applyMiddlewares(consumer);
	}
}
